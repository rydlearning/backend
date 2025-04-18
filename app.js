/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let path = require('path');
let cors = require('cors');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let errorHandler = require('./middleware/middleware.error');
let {errorHandle} = require('./core');
const mongoose = require('mongoose');

let indexRouter = require('./routes/index');
let adminRouter = require('./routes/route.admin');
let parentRouter = require('./routes/route.parent');
let partnerRouter = require('./routes/route.partner');
let promoRouter = require('./routes/route.promo');
let teacherRouter = require('./routes/route.teacher');
let commonRouter = require('./routes/route.common');
let paymentRouter = require('./routes/route.payment');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//enable cross origin
//set security guard
app.use(cors({
    credentials: true,
    origin: [
        "https://parent.rydlearning.com",
        "https://app.rydlearning.com",
        "https://rydlearning.com",
        "https://admin.rydlearning.com",
        "https://teacher.rydlearning.com",
        "https://partners.rydlearning.com",
        "https://promo.rydlearning.com",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173"]
}));
// app.use(cors());
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * list of routes
 */
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/parent', parentRouter);
app.use('/partner', partnerRouter);
app.use('/promo', promoRouter);
app.use('/teacher', teacherRouter);
app.use('/payment', paymentRouter);
app.use('/common', commonRouter);

//after all route, show 404
app.use('*', (req, res) => {
    throw new errorHandle("Resource not found", 404);
})
// app.use(function(req, res, next) {
//   next(createError(404));
// });
process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});
//Add custom error handling controller
app.use(errorHandler);

//Mongo db
const whichEnv = process.env.NODE_ENV === "prod";
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: whichEnv ? process.env.MONGO_DB_NAME : process.env.MONGO_TEST_DB_NAME
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

module.exports = app;
