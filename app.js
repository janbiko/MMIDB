"use strict";

const express = require('express'),
	  http = require('http'),
	  mysql = require('mysql'),
	  bodyParser = require('body-parser'),
    dateFormat = require('dateformat');

const app = express();

let now = new Date();

app.use(bodyParser.urlencoded({ extended: true}));
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
const baseURL = "http://localhost:3000/";


// getting index page
app.get('/', function(req, res) {
  
  res.render('pages/index', {
    siteTitle: siteTitle,
    pageTitle: "Kuriermanagement"
  });
});

// getting manager interface
app.get('/manager', function(req, res) {

  res.render('pages/manager', {
    siteTitle: siteTitle,
    pageTitle: "Kuriermanagement"
  });
});

// getting employees overview
app.get('/manager/employees', function(req, res) {

  con.query("SELECT * FROM Employees", function(err, result) {
    res.render('pages/employees', {
      siteTitle: siteTitle,
      pageTitle: "Kuriermanagement",
      items: result
    });
  });
});

/* ALT
// getting add new employee page
app.get('/manager/employees/add', function(req, res) {
  
  res.render('pages/add-employee', {
      siteTitle: siteTitle,
      pageTitle: "Kuriermanagement",
      items: ''
    });
});
*/

// inserting values from form into database
app.post('/manager/employees/add', function(req, res) {
  
  let query = "INSERT INTO Employees (Name, CurrentPosition) VALUES ( '" +
              req.body.employeeName + "', '" +
              req.body.employeePosition + "')";
  
  con.query(query, function(err, result) {
    res.redirect(baseURL + "manager/employees");
  });
});


// getting edit employee page
app.get('/manager/employees/edit/:employee_id', function(req, res) {
  
  con.query("SELECT * FROM Employees WHERE EmployeeID = '" + req.params.employee_id + "'", function(err, result) {
    res.render('pages/edit-employee', {
      siteTitle: siteTitle,
      pageTitle: "Editing employee: " + result[0].Name,
      item: result
    });
  });
});


// updating employee data
app.post('/manager/employees/edit/:employee_id', function(req, res) {
  
  let query = "UPDATE Employees SET " +
              "Name = '" + req.body.employeeName + "', " +
              "CurrentPosition = '" + req.body.employeePosition + "' " +
              "WHERE Employees.EmployeeID = " + req.body.employeeId;
  
  con.query(query, function(err, result) {
    if(result.affectedRows) res.redirect(baseURL + "manager/employees");
  });
});


// delete employee from database
app.get('/manager/employees/delete/:employee_id', function(req, res) {
  
  let query = "DELETE FROM Employees WHERE EmployeeID = " + req.params.employee_id;
  
  con.query(query, function(err, result) {
    if(result.affectedRows) res.redirect(baseURL + "manager/employees");
  });
  
});

app.get('/manager/tasks', function(req, res) {

  con.query("SELECT t.TaskID, t.Status, t.DeliveryTime, t.PickupAddress, t.DestinationAddress, e.Name " + 
  "FROM Tasks t LEFT JOIN Employees e ON e.EmployeeID = t.EmployeeID", function(err, result) {
    res.render('pages/tasks', {
      siteTitle: siteTitle,
      pageTitle: "Kuriermanagement",
      items: result
    });
  });
});

// add task to database
app.post('/manager/tasks/add', function(req, res) {

  let query = "INSERT INTO Tasks (Status, DeliveryTime, PickupAddress, DestinationAddress) VALUES ( '" +
              "Open', '" + 
              req.body.deliveryTime + "', '" + 
              req.body.pickupAddress + "', '" + 
              req.body.destinationAddress + "')";

  con.query(query, function(err, result) {
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


// updating employee data
app.post('/manager/employees/edit/:employee_id', function(req, res) {
  
  let query = "UPDATE Employees SET " +
              "Name = '" + req.body.employeeName + "', " +
              "CurrentPosition = '" + req.body.employeePosition + "' " +
              "WHERE Employees.EmployeeID = " + req.body.employeeId;
  
  con.query(query, function(err, result) {
    if(result.affectedRows) res.redirect(baseURL + "manager/employees");
  });
});


// delete task from database
app.get('/manager/tasks/delete/:task_id', function(req, res) {

  let query = "DELETE FROM Tasks WHERE TaskID = " + req.params.task_id;

  con.query(query, function(err, result) {
    if(result.affectedRows) res.redirect(baseURL + "manager/tasks");
  });
});

app.get('/employee', function(req, res) {

  let query = "SELECT EmployeeID, Name FROM Employees";
  con.query(query, function(err, result) {
    res.render('pages/employee', {
      siteTitle: siteTitle,
      pageTitle: "Kuriermanagement",
      items: result
    });
  });
});

// starting server
let server = app.listen(3000, function() {
  console.log("Server started on port 3000...");
});
