"use strict";

const express = require('express'),
  http = require('http'),
  mysql = require('mysql'),
  bodyParser = require('body-parser'),
  dateFormat = require('dateformat');

const app = express();

let now = new Date();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/css', express.static(__dirname + '/views/css'));
app.use('/js', express.static(__dirname + '/node_modules/tether/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));


const con = mysql.createConnection({
  host: '132.199.139.24',
  user: 'j.bikowski',
  password: 'mmdb',
  database: 'mmdb18_jannikbikowski'
});

const siteTitle = "MMIDB Project";
const pageTitle = "Courier Management";
const baseURL = "http://localhost:3000/";


// getting index page
app.get('/', function (req, res) {

  res.render('pages/index', {
    siteTitle: siteTitle,
    pageTitle: pageTitle
  });
});

// getting manager interface
app.get('/manager', function (req, res) {

  res.render('pages/manager', {
    siteTitle: siteTitle,
    pageTitle: pageTitle
  });
});

// getting employees overview
app.get('/manager/employees', function (req, res) {

  con.query("SELECT * FROM Employees", function (err, result) {
    res.render('pages/employees', {
      siteTitle: siteTitle,
      pageTitle: pageTitle,
      items: result
    });
  });
});

// inserting values from form into database
app.post('/manager/employees/add', function (req, res) {

  let query = "INSERT INTO Employees (Name, CurrentPosition) VALUES ( '" +
    req.body.employeeName + "', '" +
    req.body.employeePosition + "')";

  con.query(query, function (err, result) {
    res.redirect(baseURL + "manager/employees");
  });
});

// updating employee data
app.post('/manager/employees/edit/:employee_id', function (req, res) {

  let query = "UPDATE Employees SET " +
    "Name = '" + req.body.employeeName + "', " +
    "CurrentPosition = '" + req.body.employeePosition + "' " +
    "WHERE Employees.EmployeeID = " + req.body.employeeId;

  con.query(query, function (err, result) {
    if (result.affectedRows) res.redirect(baseURL + "manager/employees");
  });
});


// delete employee from database
app.get('/manager/employees/delete/:employee_id', function (req, res) {

  let query = "DELETE FROM Employees WHERE EmployeeID = " + req.params.employee_id;

  con.query(query, function (err, result) {
    if (result.affectedRows) res.redirect(baseURL + "manager/employees");
  });

});

app.get('/manager/tasks', function (req, res) {

  con.query("SELECT t.TaskID, t.Status, t.DeliveryTime, t.PickupAddress, t.DestinationAddress, e.Name " +
    "FROM Tasks t LEFT JOIN Employees e ON e.EmployeeID = t.EmployeeID", function (err, result) {
      res.render('pages/tasks', {
        siteTitle: siteTitle,
        pageTitle: pageTitle,
        items: result
      });
    });
});

// add task to database
app.post('/manager/tasks/add', function (req, res) {

  let query = "INSERT INTO Tasks (Status, DeliveryTime, PickupAddress, DestinationAddress) VALUES ( '" +
    "Open', '" +
    req.body.deliveryTime + "', '" +
    req.body.pickupAddress + "', '" +
    req.body.destinationAddress + "')";

  con.query(query, function (err, result) {
    res.redirect(baseURL + "manager/tasks");
  });
});

// edit task in database
app.post('/manager/tasks/edit/:task_id', function(req, res) {
  let query = "UPDATE Tasks SET " + 
              "DeliveryTime = '" + req.body.deliveryTime + "', " +
              "PickupAddress = '" + req.body.pickupAddress + "', " +
              "DestinationAddress = '" + req.body.destinationAddress + "' " +
              "WHERE TaskID = " + req.body.taskId;

  console.log(query);

  con.query(query, function(err, result) {
    if(result.affectedRows) res.redirect(baseURL + "manager/tasks");
  });
});

// delete task from database
app.get('/manager/tasks/delete/:task_id', function (req, res) {

  let query = "DELETE FROM Tasks WHERE TaskID = " + req.params.task_id;

  con.query(query, function (err, result) {
    if (result.affectedRows) res.redirect(baseURL + "manager/tasks");
  });
});

app.get('/employee', function (req, res) {

  let query = "SELECT EmployeeID, Name FROM Employees";
  con.query(query, function (err, result) {
    res.render('pages/employee', {
      siteTitle: siteTitle,
      pageTitle: pageTitle,
      items: result
    });
  });
});

app.get('/employee/:employee_id/tasks', function (req, res) {

  con.query("SELECT t.TaskID, t.Status, t.DeliveryTime, t.PickupAddress, t.DestinationAddress, e.Name, t.EmployeeID " +
    "FROM Tasks t LEFT JOIN Employees e ON e.EmployeeID = t.EmployeeID", function (err, result) {
      res.render('pages/task-overview', {
        siteTitle: siteTitle,
        pageTitle: pageTitle,
        items: result,
        id: req.params.employee_id,
      });
    });
});

app.post('/employee/:employee_id/tasks/accept/:task_id', function (req, res) {

  let query = "UPDATE Tasks SET Status = 'Assigned', EmployeeID = '" + req.params.employee_id + "' WHERE TaskID = '" + req.params.task_id + "'";

  con.query(query, function (err, result) {
    if (result.affectedRows) res.redirect(baseURL + "employee/" + req.params.employee_id + "/tasks");
  });
});

app.post('/employee/:employee_id/tasks/accept_task', function(req, res) {
  let employeePos = "";
  let taskAddresses = new Array();
  let queryEmployeePosition = "SELECT CurrentPosition FROM Employees WHERE EmployeeID = " + req.params.employee_id;
  let queryOpenTasks = "SELECT TaskID, PickupAddress FROM Tasks WHERE Status = 'Open'";

  con.query(queryEmployeePosition, function(err, result) {
    employeePos = result[0].CurrentPosition;
    
    con.query(queryOpenTasks, function(err, result) {
      for(let i = 0; i < result.length; i++) {
        let address = {addressId: result[i].TaskID, address: result[i].PickupAddress};
        taskAddresses.push(address);
      }
      let closestTaskId = getClosestTaskId(employeePos, taskAddresses);
      let queryAssignTask = "UPDATE Tasks SET Status = 'Assigned', EmployeeID = " + req.params.employee_id +
                            " WHERE TaskID = " + closestTaskId;
      
      con.query(queryAssignTask, function(err, result) {
        if (result.affectedRows) res.redirect(baseURL + "employee/" + req.params.employee_id + "/tasks");
      });
    });
  });
});

function getClosestTaskId(empPos, addrs) {
  empPos = empPos.match(/\d+/g).map(Number);
  let shortestDistance = Number.POSITIVE_INFINITY;
  let shortestAddrId;

  for (let i = 0; i < addrs.length; i++) {
    let address = {addressId: addrs[i].addressId, address: addrs[i].address.match(/\d+/g).map(Number)};
    let distance = Math.abs(empPos[0] - address.address[0]) + Math.abs(empPos[1] - address.address[1]);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      shortestAddrId = address.addressId;
    }
  }
  return shortestAddrId;
}

app.post('/employee/:employee_id/tasks/done/:task_id/:destinationAddress', function (req, res) {
  let query1 = "UPDATE Tasks SET Status = 'Done', EmployeeID = '" + req.params.employee_id + "' WHERE TaskID = '" + req.params.task_id + "';"
  let query2 = "UPDATE Employees SET CurrentPosition = '" + req.params.destinationAddress +"' WHERE EmployeeID = '" + req.params.employee_id + "';"
  
  
  con.beginTransaction(function (err) {
    if (err) { throw err; }
    con.query(query1, function (err, result) {
      if (err) {
        con.rollback(function () {
          throw err;
        });
      }

      var log = result.insertId;

      con.query(query2, log, function (err, result) {
        if (err) {
          con.rollback(function () {
            throw err;
          });
        }
        con.commit(function (err) {
          if (err) {
            con.rollback(function () {
              throw err;
            });
          }
          console.log('Transaction Complete.');
          if (result) res.redirect(baseURL + "employee/" + req.params.employee_id + "/tasks");
          con.commit();
        });
      });
    });
  });
});

// starting server
let server = app.listen(3000, function () {
  console.log("Server started on port 3000...");
});
