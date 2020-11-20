const kanbn = require('../lib/main');
const utility = require('../lib/utility');
const inquirer = require('inquirer');

/**
 * Remove a task
 * @param {string} taskId
 * @param {boolean} removeFile
 */
function removeTask(taskId, removeFile) {
  kanbn
  .deleteTask(taskId, removeFile)
  .then(taskId => {
    console.log(`Removed task "${taskId}"${removeFile ? ' from the index' : ' file and index entry'}`);
  })
  .catch(error => {
    utility.showError(error);
  });
}

module.exports = async (args) => {

  // Make sure kanbn has been initialised
  if (!await kanbn.initialised()) {
    console.error(utility.replaceTags('Kanbn has not been initialised in this folder\nTry running: {b}kanbn init{b}'));
    return;
  }

  // Get the task that we're removing
  const taskId = args._[1];
  if (!taskId) {
    console.error(utility.replaceTags('No task id specified. Try running {b}kanbn remove "task id"{b}'));
    return;
  }

  // Make sure the task exists
  try {
    await kanbn.taskExists(taskId);
  } catch (error) {
    utility.showError(error);
    return;
  }

  // Get the index
  let index;
  try {
    index = await kanbn.getIndex();
  } catch (error) {
    utility.showError(error);
    return;
  }

  // If the force flag is specified, remove the task without asking
  if (args.force) {
    removeTask(taskId, args.index);

  // Otherwise, prompt for confirmation first
  } else {
    inquirer.prompt([
      {
        type: 'confirm',
        message: 'Are you sure you want to remove this task?',
        name: 'sure',
        default: false
      }
    ]).then(async answers => {
      if (answers.sure) {
        removeTask(taskId, args.index);
      }
    }).catch(error => {
      utility.showError(error);
    })
  }
};
