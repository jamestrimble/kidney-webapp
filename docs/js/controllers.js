'use strict';

/* Controllers */

var kidneyControllers = angular.module('kidneyControllers' , []);

/*
kidneyControllers.controller('AnalyserCtrl', function($scope, $http) {
  $scope.results = [];
  $scope.onSubmitted = function() {
    var files = $("#analyser-file").get(0).files;
    $scope.uploadFile(files, 0);
    $scope.results = [];
  };
  $scope.uploadFile = function(files, index) {
    if (index >= files.length) return;
    var file = files[index];
    var fileName = file.name;
    var reader = new FileReader();
    if (/\.json$/.test(fileName)) {
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readJsonString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    } else if (/\.input$/.test(fileName)) {
      console.log("input");
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readInputString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    } else if (/\.xml$/.test(fileName)) {
      console.log("xml");
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readXmlString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    }
    reader.readAsText(file);
  };
  var analyse = function(compactData, fileName, files, index) {
    $http({
      method: "POST",
      url: 'http://guarded-chamber-5937.herokuapp.com/',
      //url: 'http://localhost:5000',
      data: $.param({data:compactData}),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data) {
      data.fileName = fileName;
      $scope.results.push(data);
      $scope.uploadFile(files, index+1);
    });
  }
});
*/

kidneyControllers.controller('ConverterCtrl', function($scope) {
  $scope.fileFormat = "xml";
  $scope.onSubmitted = function() {
    var zip = new JSZip();
    var nConverted = 0;
    var files = $("#converter-file").get(0).files;
    for (var i=0; i<files.length; i++) {
      var selectedFile = files[i];
      console.log(selectedFile.name);
      var reader = new FileReader();
      (function() {
        var fileName = selectedFile.name;
        var baseName = fileName.replace(/\.[^.]*$/, "");
        reader.onload = function(e) {
          console.log(e.target.result);
          var iDataset = new GeneratedDataset();
          if (/\.json$/.test(fileName)) {
            iDataset.readJsonString(e.target.result);
          } else if (/\.xml$/.test(fileName)) {
            iDataset.readXmlString(e.target.result);
          } else {
            iDataset.readInputString(e.target.result);
          }
          console.log(iDataset);
          nConverted++;
          if ($scope.fileFormat==="xml") {
            zip.file(baseName + ".xml", iDataset.toXmlString());
          } else {
            zip.file(baseName + ".json", iDataset.toJsonString());
          }
          if (nConverted===files.length) {
            var content = zip.generate({type:"blob"});
            saveAs(content, "converted.zip");
          }
        }; 
      })();

      reader.readAsText(selectedFile);
    }

    /*var formData = new FormData($('#converter-form')[0]);
    var beforeSendHandler = function() {};
    var completeHandler = function() {};
    var errorHandler = function() {};
    var progressHandlingFunction = function(d) {console.log(d)};
    $.ajax({
        url: '/to-json.json',  //Server script to process data
        type: 'POST',
        xhr: function() {  // Custom XMLHttpRequest
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // Check if upload property exists
                myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // For handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax events
        beforeSend: beforeSendHandler,
        success: completeHandler,
        error: errorHandler,
        // Form data
        data: formData,
        //Options to tell jQuery not to process data or worry about content-type.
        cache: false,
        contentType: false,
        processData: false
    });*/
  };
});




kidneyControllers.controller('GeneratorCtrl', function($scope) {
  /*$scope.phones = [
    {'name': 'Nexus S',
     'snippet': 'Fast just got faster with Nexus S.'},
    {'name': 'Motorola XOOM™ with Wi-Fi',
     'snippet': 'The Next, Next Generation tablet.'},
    {'name': 'MOTOROLA XOOM™',
     'snippet': 'The Next, Next Generation tablet.'}
  ];*/


  $scope.donorTypeO = 0.4;
  $scope.donorTypeA = 0.4;
  $scope.donorTypeB = 0.1;
  $scope.donorTypeAB = function(x) {
      return +(1-$scope.donorTypeO-$scope.donorTypeA-$scope.donorTypeB).toFixed(4);
  };

  $scope.patientTypeO = 0.4;
  $scope.patientTypeA = 0.4;
  $scope.patientTypeB = 0.1;
  $scope.patientTypeAB = function(x) {
      return +(1-$scope.patientTypeO-$scope.patientTypeA-$scope.patientTypeB).toFixed(4);
  };

  $scope.donorsPerPatient1 = 1;
  $scope.donorsPerPatient2 = 0;
  $scope.donorsPerPatient3 = 0;
  $scope.donorsPerPatient4 = function(x) {
      return +(1-$scope.donorsPerPatient1-$scope.donorsPerPatient2-$scope.donorsPerPatient3).toFixed(4);
  };

  $scope.probSpousal = 0;
  $scope.probFemale = 0;
  $scope.probSpousalPraCompatibility = 0;

  $scope.crfDistribution = "0.2 0.11\n0.8 0.89";

  $scope.fileFormat = "xml";
  $scope.patientsPerInstance = 50;
  $scope.numberOfInstances = 5;
  $scope.proportionAltruistic = 0;

  
  $scope.onSubmitted = function() {
    var genConfig = {
      donorCountProbabilities: [
        $scope.donorsPerPatient1,
        $scope.donorsPerPatient2,
        $scope.donorsPerPatient3,
        $scope.donorsPerPatient4
      ],
      donorBtDistribution: new BloodTypeDistribution(
        $scope.donorTypeO,
        $scope.donorTypeA,
        $scope.donorTypeB,
        $scope.donorTypeAB
      ),
      patientBtDistribution: new BloodTypeDistribution(
        $scope.patientTypeO,
        $scope.patientTypeA,
        $scope.patientTypeB,
        $scope.patientTypeAB
      ),
      probSpousal: $scope.probSpousal,
      probFemale: $scope.probFemale,
      probSpousalPraCompatibility: $scope.probSpousalPraCompatibility,
      numberOfInstances: $scope.numberOfInstances,
      patientsPerInstance: $scope.patientsPerInstance,
      proportionAltruistic: $scope.proportionAltruistic,
      fileFormat: $scope.fileFormat,
      praBandsString: $scope.crfDistribution
    }
    console.log(genConfig);
    var gen = new KidneyGenerator(genConfig);
    var zip = new JSZip();
    $("#progress-message").text("Generating instance 0");
      setTimeout(function() {
        generateInstances(zip, gen, genConfig, 0);
      }, 1);
    }
});

// TODO: put this somewhere other than global scope
var generateInstances = function(zip, gen, genConfig, i) {
  var generatedDataset =
      gen.generateDataset(genConfig.patientsPerInstance,
                          genConfig.proportionAltruistic);
  if (genConfig.fileFormat==="xml") {
    zip.file("genxml-" + i + ".xml", generatedDataset.toXmlString());
  } else if (genConfig.fileFormat==="json") {
    zip.file("genjson-" + i + ".json", generatedDataset.toJsonString());
  }

  if (++i < genConfig.numberOfInstances) {
    $("#progress-message").text("Generating instance " + i);
    setTimeout(function() {generateInstances(zip, gen, genConfig, i)}, 1);
  } else {
    $("#progress-message").text("Creating zip file.");
    setTimeout(function() {
      var content = zip.generate({type:"blob"});
      saveAs(content, "generated.zip");
      $("#progress-message").text("Finished.");
    }, 1);
  }
};

/*$( "#generator-form" ).on( "submit", function( event ) {
  event.preventDefault();
  var genConfig = $( this ).serializeObject();
  ////console.log(genConfig);
  var gen = new KidneyGenerator(genConfig);
  var zip = new JSZip();
  
  $("#progress-message").text("Generating instance 0");
  setTimeout(function() {
    generateInstances(zip, gen, 0);
  }, 1);
});
*/



kidneyControllers.controller('HomeCtrl', function($scope) {});

