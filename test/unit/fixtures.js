const mockFileSystem = require('mock-fs');
const faker = require('faker');
const paramCase = require('param-case').paramCase;
const parseIndex = require('../../lib/parse-index.js');
const parseTask = require('../../lib/parse-task.js');

function generateTask(i) {
  const COUNT_TAGS = faker.random.number(5);

  return {
    name: `Task ${i + 1}`,
    description: faker.lorem.paragraph(),
    metadata: {
      created: faker.date.past().toISOString(),
      update: faker.date.past().toISOString(),
      due: faker.date.future().toISOString(),
      tags: new Array(COUNT_TAGS).fill(null).map(i => faker.lorem.word())
    },
    subTasks: generateSubTasks(),
    relations: []
  };
}

function generateSubTasks() {
  const COUNT_SUB_TASKS = faker.random.number(10);

  return new Array(COUNT_SUB_TASKS).fill(null).map(i => ({
    text: faker.lorem.sentence(),
    completed: faker.random.boolean()
  }));
}

function addRelations(task, taskIds) {
  const COUNT_RELATIONS = faker.random.number(4);

  const relationTypes = ['', 'blocks ', 'duplicates ', 'requires ', 'obsoletes '];
  return new Array(COUNT_RELATIONS).fill(null).map(i => ({
    task: taskIds[Math.floor(Math.random() * taskIds.length)],
    type: relationTypes[Math.floor(Math.random() * relationTypes.length)]
  }));
}

module.exports = (options = {}) => {
  const COUNT_COLUMNS = options.columns || faker.random.number(4) + 1;
  const COUNT_TASKS = options.tasks || faker.random.number(9) + 1;

  // Generate tasks
  const tasks = new Array(COUNT_TASKS).fill(null).map((v, i) => generateTask(i));
  const taskIds = tasks.map(i => paramCase(i.name));
  tasks.forEach(i => addRelations(i, taskIds));

  // Generate and populate columns
  const columnNames = options.columnNames || new Array(COUNT_COLUMNS).fill(null).map((v, i) => `Column ${i + 1}`);
  const columns = Object.fromEntries(columnNames.map(i => [i, []]));
  for (let taskId of taskIds) {
    if (options.randomiseColumns === false) {
      columns[columnNames[0]].push(taskId);
    } else {
      columns[columnNames[Math.floor(Math.random() * columnNames.length)]].push(taskId);
    }
  }

  // Generate index
  const index = {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    columns
  };

  // Generate in-memory files
  mockFileSystem({
    '.kanbn': {
      'index.md': parseIndex.json2md(index),
      'tasks': Object.fromEntries(tasks.map(i => [`${paramCase(i.name)}.md`, parseTask.json2md(i)]))
    }
  });

  return index;
};
