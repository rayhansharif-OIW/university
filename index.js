/* eslint-disable eol-last */
/* eslint-disable prettier/prettier */
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// internel imports
const { userRouter } = require('./router/userRouter/userRouter');

const { notFoundHandler, errorHandler } = require('./middlewares/common/errorHandler');
const AuthRouter = require('./router/loginRouter/loginRouter');

const app = express();
dotenv.config();

// request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// routing setup
app.use('/users', userRouter);
app.use('/auth', AuthRouter);
app.get('/', (req, res) => {
    res.json({ homepage: 'homepage' });
});

// error handling
// 404 notfound handler
app.use(notFoundHandler);
app.use(errorHandler);
// default errorHandler

app.listen(process.env.PORT, () => {
    console.log(`listening to the port ${process.env.PORT}`);
});