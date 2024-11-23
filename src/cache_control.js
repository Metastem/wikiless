const fs = require('fs/promises'); // Use promises for better handling
const path = require('path');
const config = require('../config');

async function deleteStatic() {
  const wiki_files = path.resolve(__dirname, '../media/wikipedia'); // Resolve relative path

  try {
    await fs.rm(wiki_files, { recursive: true, force: true });
    console.log(
      'Cleared cached static media files. You can turn this off by setting the config.cache_control to false.'
    );
  } catch (error) {
    console.error(`Error clearing cached static media files: ${error.message}`);
  }
}

module.exports.removeCacheFiles = function () {
  if (config.cache_control) {
    deleteStatic();

    let hours = parseInt(config.cache_control_interval, 10);
    if (isNaN(hours) || hours < 1) {
      console.warn(
        'Invalid cache_control_interval. Defaulting to 24 hours.'
      );
      hours = 24;
    }

    setInterval(() => {
      deleteStatic();
    }, 1000 * 60 * 60 * hours);
  }
};
