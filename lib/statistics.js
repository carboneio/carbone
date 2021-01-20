const keyToConvertInMs = ['preProcessingTime', 'planningTime', 'injectionTime', 'assemblyTime', 'executionTime', 'convertTime'];

function startRecording (options, action) {
  options.carboneTime.set(action, process.hrtime.bigint());
}

function endRecording (options, action) {
  const start = options.carboneTime.get(action);
  const end = process.hrtime.bigint();

  let statValue = options.carboneStatistics;

  if (statValue[action] !== undefined) {
    statValue[action] += (end - start);
  }
  else {
    statValue[action] = end - start;
  }

  options.carboneStatistics = statValue;
  options.carboneTime.delete(action);
}

function addValue (options, key, value) {
  if (options.carboneStatistics[key] === undefined) {
    options.carboneStatistics[key] = value;
  }
  else {
    options.carboneStatistics[key] += value;
  }
}

function formatResult (statistics) {
  for (let i = 0; i < keyToConvertInMs.length; i++) {
    if (statistics[keyToConvertInMs[i]] !== undefined) {
      statistics[keyToConvertInMs[i]] = Number(statistics[keyToConvertInMs[i]] / BigInt(1000));
    }
  }

  return statistics;
}

module.exports = {
  startRecording,
  endRecording,
  addValue,
  formatResult
};
