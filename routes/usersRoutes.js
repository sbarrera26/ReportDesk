import express from 'express';
import passport from 'passport';
import {
  user_by_email,
  get_course_codes,
  get_role_codes,
  reset_password,
  set_new_password,
  create_user,
  delete_user,
} from '../controllers/userControl.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import{checkPermission} from '../middleware/rbacMiddleware.js';




export const routerUser = express.Router();

routerUser.post('/login', passport.authenticate('local', {
  successRedirect: '/users/getRecords',
  failureRedirect: '/',
}));

// this is for authentication



routerUser.post('/login', user_by_email);
routerUser.get('/getRecords', isAuthenticated, get_course_codes);
routerUser.post('/password-reset', reset_password);

routerUser.get('/password-reset', (req, res) => {
  res.render('password-reset/page1');
});

routerUser.get('/set-new-password', (req, res) => {
  const token = req.query.token;
  const email = req.query.email;
  res.render('password-reset/page2', { token, email });
});

routerUser.post('/set-new-password', set_new_password);

routerUser.get('/password-reset-success', (req, res) => {
  res.render('password-reset/page3');
});

routerUser.get('/create-user', isAuthenticated, checkPermission("users"), get_role_codes);

routerUser.post('/create-user', create_user);

routerUser.get('/manage-user', isAuthenticated, checkPermission("users"), (req, res) => {
  res.render('Manage_users');
});

routerUser.post('/delete-user', delete_user);

routerUser.get('/logout', (req, res) => {
  res.clearCookie('connect.sid');  // clear the session cookie
	req.logout(function(err) {  // logout of passport
		req.session.destroy(function (err) { // destroy the session
			res.redirect('/'); // send to the client
		});
	});
});