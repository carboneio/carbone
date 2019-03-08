var spawn = require('child_process').spawn;


var i= 0;
while(i < 200) {
  i++;
  console.log('start');
  var _officeThread = spawn('sleep', [2]);
  _officeThread.stdout.setEncoding('utf8');
  _officeThread.stdout.on('data', function(data){
    //console.log(data);
  }); 
  _officeThread.on('exit', function(){
    console.log('exit');
  })
_officeThread.on('error', function (err) {
        console.log(err);
})
}