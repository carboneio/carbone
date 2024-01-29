
/**
 * Generate a unique id to get data updated by aggregators
 * @private
 */
function generateAggregatorId (id, ...partitionBy) {
  return id + '_' + partitionBy.join('_');
}

/**
 * Dynamically replace formatter in the builder
 *
 * @private
 * @param   {Object}   parsedFormatter                    The parsed formatter. Ex:  { str : sum, args : [0]}
 * @param   {Array}    currentIterators                   The current iterators
 * @param   {Boolean}  isCalledInPrecomputedReducedArray  Indicates if called in precomputed reduced array
 * @return  {Array}    Array of formatter to call with their arguments
 */
function _replaceEmptyArguments (parsedFormatter, currentIterators, isCalledInPrecomputedReducedArray) {
  let _arg = 'i';
  // If the function is called in a preprocess/reduce loop (ex. "d.cars[i].wheels[]" without iterator on second array)
  // and if the user has not set any arguments, Carbone adds automatically multiple ".i" in argument of the formatter (ex. "aggSUm(.i)") to get the sum by "cars".
  const _newArguments = parsedFormatter.args.length > 0 || isCalledInPrecomputedReducedArray === false
    ? parsedFormatter.args
    : currentIterators.map(() => {
      _arg = '.'+_arg;
      return _arg;
    });
  return [
    // call the first formatter (ex. aggSum), and tells the builder to call the next formatter later in the process
    { str : parsedFormatter.str,           args : _newArguments, isNextFormatterExecutionPostponed : true },
    // This formatter will return the result of the total SUM, and will be called at the end in assembleXmlParts
    { str : (parsedFormatter.str + 'Get'), args : _newArguments }
  ];
}

/**
 * Dynamically replace formatter in the builder for cumulative formatters
 *
 * @private
 * @param   {Object}   parsedFormatter                    The parsed formatter. Ex:  { str : sum, args : [0]}
 * @return  {Array}    Array of formatter to call with their arguments
 */
function _replaceCumulative (parsedFormatter) {
  return [
    { str : parsedFormatter.str, args : parsedFormatter.args, isNextFormatterExecutionPostponed : true },
    { str : parsedFormatter.str.replace(/^cum/, 'agg'), args : parsedFormatter.args }
  ];
}


/* ************************************************************************************************************** */

/**
 * total SUM
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function aggSum (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? 0;
  _val += parseFloat(d ?? 0);
  this.aggDatabase.set(_id, _val);
  return _val;
}
// This formatter will be dynamically replaced by two formatters, with specific execution options for builder.
// It works almost like formatters which returns postprocess functions, but with a little more options.
// With this method, the builder will also postprocess other formatters which are called after aggSum  (ex. aggSum:formatC)
aggSum.replacedBy = _replaceEmptyArguments;
// Tells the builder this formatter can be called in preprocess/reduce loop (ex. "d.cars[i].wheels[]" without iterator on second array)
aggSum.canBeCalledInPrecomputedLoop = true;

/**
 * Get current result of the SUM aggregator
 * TODO TEST  partitionBy
 *
 * @private
 */
function aggSumGet (d, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  return this.aggDatabase.get(_id) ?? 0;
}


/**
 * Dynamically replace formatter in the builder (specific for aggStr)
 *
 * @private
 * @param   {Object}   parsedFormatter                    The parsed formatter. Ex:  { str : sum, args : [0]}
 * @param   {Array}    currentIterators                   The current iterators
 * @param   {Boolean}  isCalledInPrecomputedReducedArray  Indicates if called in precomputed reduced array
 * @return  {Array}    Array of formatter to call with their arguments
 */
function _replaceEmptyArgumentsStr (parsedFormatter, currentIterators, isCalledInPrecomputedReducedArray) {
  let _separator = ', ';
  if (parsedFormatter.args.length > 0) {
    _separator = parsedFormatter.args.shift(); // backup separator
  }
  const _replaced = _replaceEmptyArguments(parsedFormatter, currentIterators, isCalledInPrecomputedReducedArray);
  _replaced[0].args.unshift(_separator); // restore separator
  if (isCalledInPrecomputedReducedArray === true) {
    _replaced[1].str += 'Reverse';
  }
  return _replaced;
}

/**
 * Aggregate string
 *
 * @version 4.17.0
 *
 * @param  {Number} d            Concatenate text with a separator
 * @param  {String} separator    [optional] by default ', '
 * @param  {Mixed}  partitionBy  [optional] group by
 * @return {String}              return the result
 */
function aggStr (d, separator = ', ', ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? [];
  if (d !== null && d !== undefined) {
    _val.push(d);
    this.aggDatabase.set(_id, _val);
  }
  return _val;
}
// This formatter will be dynamically replaced by two formatters, with specific execution options for builder.
// It works almost like formatters which returns postprocess functions, but with a little more options.
// With this method, the builder will also postprocess other formatters which are called after aggSum  (ex. aggSum:formatC)
aggStr.replacedBy = _replaceEmptyArgumentsStr;
// Tells the builder this formatter can be called in preprocess/reduce loop (ex. "d.cars[i].wheels[]" without iterator on second array)
aggStr.canBeCalledInPrecomputedLoop = true;

/**
 * Get current result of the SUM aggregator
 *
 * @private
 */
function aggStrGet (d, separator, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  // TODO Could we avoid the reverse in v5??
  return this.aggDatabase.get(_id)?.join(separator) ?? '';
}

/**
 * Get current result of the SUM aggregator
 *
 * @private
 */
function aggStrGetReverse (d, separator, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  const _list = this.aggDatabase.get(_id);
  if (_list && _list.isReversed !== true) {
    _list.reverse(); // TODO Could we avoid the reverse in v5??
    _list.isReversed = true;
  }
  return _list?.join(separator) ?? '';
}

/**
 * Cumulative SUM
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function cumSum (d) {
  return d;
}
cumSum.replacedBy = _replaceCumulative;
cumSum.canBeCalledInPrecomputedLoop = true;

/* ************************************************************************************************************** */

/**
 * AVG aggregator
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function aggAvg (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? { sum : 0, nb : 0 };
  _val.nb++;
  _val.sum += parseFloat(d ?? 0);
  this.aggDatabase.set(_id, _val);
  return _val.sum / _val.nb; // TODO useless in normal AVG, used only by cumulative, 
}
aggAvg.replacedBy = _replaceEmptyArguments;
aggAvg.canBeCalledInPrecomputedLoop = true;


/**
 * Get current result of the aggregator
 *
 * @private
 */
function aggAvgGet (d, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  const _val = this.aggDatabase.get(_id);
  const _res = _val ? (_val.sum / _val.nb) : 0;
  return _res;
}


/**
 * Cumulative AVG
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function cumAvg (d) {
  return d;
}
cumAvg.replacedBy = _replaceCumulative;
cumAvg.canBeCalledInPrecomputedLoop = true;

/* ************************************************************************************************************** */

/**
 * min aggregator
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function aggMin (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? Number.MAX_SAFE_INTEGER;
  const _float = parseFloat(d ?? Number.MAX_SAFE_INTEGER);
  if (_float < _val) {
    this.aggDatabase.set(_id, _float);
    return _float;
  }
  return _val;
}
aggMin.replacedBy = _replaceEmptyArguments;
aggMin.canBeCalledInPrecomputedLoop = true;

/**
 * Get current result of the aggregator
 *
 * @private
 */
function aggMinGet (d, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  return this.aggDatabase.get(_id) ?? 0;
}


/* ************************************************************************************************************** */

/**
 * max aggregator
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function aggMax (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? Number.MIN_SAFE_INTEGER;
  const _float = parseFloat(d ?? Number.MIN_SAFE_INTEGER);
  if (_float > _val) {
    this.aggDatabase.set(_id, _float);
  }
}
aggMax.replacedBy = _replaceEmptyArguments;
aggMax.canBeCalledInPrecomputedLoop = true;

/**
 * Get current result of the aggregator
 *
 * @private
 */
function aggMaxGet (d, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  return this.aggDatabase.get(_id) ?? 0;
}

/* ************************************************************************************************************** */

/**
 * count aggregator
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function aggCount (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _val = this.aggDatabase.get(_id) ?? 0;
  this.aggDatabase.set(_id, ++_val);
  return _val;
}
aggCount.replacedBy = _replaceEmptyArguments;
aggCount.canBeCalledInPrecomputedLoop = true;

/**
 * Get current result of the aggregator
 *
 * @private
 */
function aggCountGet (d, ...partitionBy) {
  const _id = generateAggregatorId(this.id, ...partitionBy);
  return this.aggDatabase.get(_id) ?? 0;
}


/**
 * Cumulative COUNT
 * TODO : manage partitionBy
 *
 * @version 4.0.0
 *
 * @param  {Number} d           Number to aggregate
 * @param  {Mixed} partitionBy  [optional] group by
 * @return {String}             return the result
 */
function cumCount (d, ...partitionBy) {
  return d;
}
cumCount.replacedBy = _replaceCumulative;
cumCount.canBeCalledInPrecomputedLoop = true;


/**
 * Dynamically replace formatter in the builder for cumulative formatters
 *
 * @private
 * @param   {Object}   parsedFormatter                    The parsed formatter. Ex:  { str : sum, args : [0]}
 * @return  {Array}    Array of formatter to call with their arguments
 */
function _replaceCumulativeDistinct (parsedFormatter) {
  return [
    { str : parsedFormatter.str, args : parsedFormatter.args, isNextFormatterExecutionPostponed : true },
    { str : parsedFormatter.str.replace(/^cum/, '_agg'), args : parsedFormatter.args }
  ];
}
/**
 * Dynamically replace formatter in the builder for cumulative formatters
 *
 * @private
 */
function _aggCountD (d, ...partitionBy) {
  const _id  = generateAggregatorId(this.id, ...partitionBy);
  let _state = this.aggDatabase.get(_id) ?? { sum : 0 };
  if (d !== _state.prev) {
    _state.sum++;
    _state.prev = d;
  }
  this.aggDatabase.set(_id, _state);
  return _state.sum;
}
_aggCountD.replacedBy = _replaceEmptyArguments;
_aggCountD.canBeCalledInPrecomputedLoop = true;

/**
 * Cumulative count of distinct values
 *
 * @version 4.15.7
 *
 * @param  {Number} d           Number to aggregate
 * @return {String}             return the result
 */
function cumCountD (d) {
  return d;
}
cumCountD.replacedBy = _replaceCumulativeDistinct;
cumCountD.canBeCalledInPrecomputedLoop = true;


/**
 * Store result into data object `{d.` for later use. Current limits:
 *   - accepts only to store values at the root level of `d`, and only in `d`.
 *   - cannot be used in aliases
 *
 * @version 4.5.2
 *
 * @param  {Mixed}  d        The value to store
 * @param  {String} param    destination variable in data. Ex. `d.myNewVariable`
 * @return {String}          Nothing
 */
function set (d, param) {
  if ( param.startsWith('c.') === true ) {
    const _attribute = param.replace('c.', '');
    this.c[_attribute] = d;
    return '';
  }
  const _attribute = param.replace('d.', '');
  this.d[_attribute] = d;
  return '';
}

module.exports = {
  aggStr,
  aggStrGet,
  aggStrGetReverse,
  aggSum,
  aggSumGet,
  set,
  aggAvg,
  aggAvgGet,
  aggMin,
  aggMinGet,
  aggMax,
  aggMaxGet,
  aggCount,
  aggCountGet,
  cumSum,
  cumAvg,
  cumCount,
  cumCountD,
  _aggCountD
};
