const kanbn = require('../lib/main');
const utility = require('../lib/utility');
const inquirer = require('inquirer');
const Spinner = require('cli-spinner').Spinner;

inquirer.registerPrompt('recursive', require('inquirer-recursive'));

/**
 * Initialise kanbn interactively
 * @param {object} options
 * @param {boolean} initialised
 */
async function interactive(options, initialised) {
  return await inquirer
  .prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: options.name || '',
      validate: value => {
        if ((/.+/).test(value)) {
          return true;
        }
        return 'Project name cannot be empty';
      }
    },
    {
      type: 'confirm',
      name: 'setDescription',
      message: initialised ? 'Edit the project description?' : 'Add a project description?'
    },
    {
      type: 'editor',
      name: 'description',
      message: 'Project description:',
      default: options.description || '',
      when: answers => answers.setDescription
    },
    {
      type: 'recursive',
      initialMessage: 'Add a column?',
      message: 'Add another column?',
      name: 'columns',
      when: () => !initialised,
      prompts: [
        {
          type: 'input',
          name: 'columnName',
          message: 'Column name:',
          validate: value => {
            if (value.length === 0) {
              return 'Column name cannot be empty';
            }
            if (options.columns.indexOf(value) !== -1) {
              return 'Column name already exists';
            }
            return true;
          }
        }
      ]
    }
  ]);
}

/**
 * Initialise kanbn
 * @param {object} options
 * @param {boolean} initialised
 */
function initialise(options, initialised) {
  const spinner = new Spinner('Initialising...');
  spinner.setSpinnerString(18);
  spinner.start();
  kanbn
  .initialise(options)
  .then(() => {
    spinner.stop(true);
    if (initialised) {
      console.log(`Reinitialised existing kanbn board in ${kanbn.getMainFolder()}`);
    } else {
      console.log(`Initialised empty kanbn board in ${kanbn.getMainFolder()}`);
    }
  })
  .catch(error => {
    spinner.stop(true);
    utility.showError(error);
  });
}

module.exports = async args => {
  let options = {};

  // If this folder is already initialised, set the default name and description using the current values
  const initialised = await kanbn.initialised();
  if (initialised) {
    try {
      const index = await kanbn.getIndex();
      options.name = index.name;
      options.description = index.description;
      options.columns = Object.keys(index.columns);
    } catch (error) {
      utility.showError(error);
      return;
    }
  }

  // Check for arguments and override the defaults if present
  // Project name
  if (args.name) {
    options.name = args.name;
  }

  // Project description
  if (args.description) {
    options.description = args.description;
  }

  // Columns
  if (args.column) {
    options.columns = Array.isArray(args.column) ? args.column : [args.column];
  }

  // Interactive initialisation
  if (args.interactive) {
    interactive(options, initialised)
    .then(answers => {
      if ('columns' in answers) {
        answers.columns = answers.columns.map(column => column.columnName);
      }
      initialise(answers, initialised);
    })
    .catch(error => {
      utility.showError(error);
    });

  // Non-interactive initialisation
  } else {
    initialise(options, initialised);
  }
};
