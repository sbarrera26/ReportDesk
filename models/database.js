import mysql from 'mysql2'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
dotenv.config()
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
}).promise()

export async function getUser(id) {
  const [rows] = await pool.query(`
  SELECT * 
  FROM users 
  WHERE userID = ?
  `,[id])
  return rows[0]
}

export async function getUserByEmail(email) {
    const [rows] = await pool.query(`
    SELECT * 
    FROM users 
    WHERE email = ?
    `,[email])
    console.log(rows)
    return rows
}

export async function getCoursecodes(){
    const [rows] = await pool.query(`
    SELECT courseCode 
    FROM courses
    `)
    console.log(rows)
    return rows
}

export async function getRoles(){
  const [rows] = await pool.query(`
  SELECT userRole 
  FROM role
  `)
  console.log(rows)
  return rows
}

export async function getDailyReport(day){
    console.log(day)
    const [rows] = await pool.query(`
    SELECT 
    (SELECT SUM(headCount) 
    FROM count WHERE DATE(dateOfCount) = ?) as headCount, 
    (SELECT COUNT(*) 
    FROM questions WHERE DATE(dateofQuestion) = ?) as questionCount;
    `, [day, day])
    console.log(rows)
    return rows
}

export async function getMonthlyReport(dateArray){
    const [rows] = await pool.query(`
    SELECT 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?, 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?, 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?, 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?, 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?, 
    (SELECT COUNT(*) FROM questions WHERE dateofQuestion LIKE ?) as ?;
    `, [dateArray[0] +'%',dateArray[0], dateArray[1]+'%', dateArray[1], dateArray[2]+'%', dateArray[2], dateArray[3]+'%', dateArray[3], dateArray[4]+'%', dateArray[4], dateArray[5]+'%', dateArray[5]])
    console.log(rows)
    return rows
}

export async function getYearlyReport(year){
    const [rows] = await pool.query(`
    SELECT
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 8) as hr8am,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 9) as hr9am,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 10) as hr10am,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 11) as hr11am,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 12) as hr12pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 13) as hr1pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 14) as hr2pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 15) as hr3pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 16) as hr4pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 17) as hr5pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 18) as hr6pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 19) as hr7pm,
    (SELECT SUM(headCount) FROM count WHERE EXTRACT(year from dateofCount)=? AND  HOUR(CONVERT_TZ(dateOfCount, 'UTC', 'America/Chicago')) = 20) as hr8pm;
    `, [year,year,year,year,year,year,year,year,year,year,year,year,year])
    console.log(rows)
    return rows
}

export async function getLocationReport(year){
    const [rows] = await pool.query(`
    SELECT 
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and locationID = 1) as In_Person,  
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and locationID = 2) as Phone,
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and locationID = 3) as Online; 
    `, [year,year,year])
    console.log(rows)
    return rows
}

export async function getDurationReport(year){
    const [rows] = await pool.query(`
    SELECT 
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and durationID = 1) as five,  
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and durationID = 2) as twenty_nine,
    (SELECT COUNT(*) FROM questions WHERE EXTRACT(year from dateOfQuestion)=? and durationID = 3) as thirty;  
    `, [year,year,year])
    console.log(rows)
    return rows
}

export async function getCoursesReport(year){
    const [rows] = await pool.query(`
    SELECT courses.courseCode, COUNT(*) AS numberOfQuestions
    FROM questions
    INNER JOIN courses ON questions.courseID=courses.courseID
    WHERE EXTRACT(year from questions.dateOfQuestion)=?
    GROUP BY  questions.courseID
    ORDER BY numberOfQuestions DESC
    LIMIT 5;
    `, [year])
    console.log(rows)
    return rows
}

export async function saveResetToken(email, token) {
    try {
      await pool.query(`
        INSERT INTO password_resets (email, token, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
      `, [email, token]);
      console.log('Reset token saved successfully');
    } catch (error) {
      console.error('Error saving reset token:', error);
      throw error;
    }
  }

  export async function getUserByResetToken(token) {
    console.log('Received Token in getUserByResetToken:', token);
    const [rows] = await pool.query(`
      SELECT * 
      FROM password_resets
      WHERE expires_at > NOW()
    `);
    console.log('Reset Token Rows:', rows);
  
    for (const row of rows) {
      const isMatch = await bcrypt.compare(token, row.token);
      if (isMatch) {
        return row;
      }
    }
  
    return null;
  }

export async function updatePassword(email, hashedPassword) {
    const [result] = await pool.query(`
      UPDATE users 
      SET password = ?
      WHERE email = ?
    `, [hashedPassword, email]);
    console.log('Update Password Result:', result);
  }

  export async function deleteResetToken(email) {
    await pool.query(`
    DELETE FROM password_resets
    WHERE email = ?
    `, [email])
}

export async function insertQuestionNoDate(categoryID, locationID, durationID, courseID, notes, userID){
    const [rows] = await pool.query(`
    INSERT 
    INTO questions (categoryID, locationID, durationID, courseID, notes, userID)
    VALUES(?,?,?,?,?,?);
    `, [categoryID, locationID, durationID, courseID, notes, userID])
    console.log(rows);
    return rows
}

export async function insertQuestionYesDate(categoryID, locationID, durationID, courseID, notes, userID, dateOfQuestion){
    const [rows] = await pool.query(`
    INSERT 
    INTO questions (categoryID, locationID, durationID, courseID, notes, userID, dateOfQuestion)
    VALUES(?,?,?,?,?,?,?);
    `, [categoryID, locationID, durationID, courseID, notes, userID, dateOfQuestion])
    console.log(rows);
    return rows
}

export async function insertHeadcount(headCount, userID){
  const [rows] = await pool.query("INSERT INTO `count` (headCount, userID) VALUES(?,?)", [headCount,userID])
  console.log(rows);
  return rows
}

export async function checkLastHeadCount(datetime){
  const [rows] = await pool.query(`
    SELECT dateOfcount 
    FROM count
    ORDER BY  dateOfCount DESC
    LIMIT 1
  `, [datetime])
  console.log(rows);
  return rows
}

export async function getLocationID(location){
    const [rows] = await pool.query('Select locationID from locations WHERE location = ?' ,[location]);
    console.log(rows)
    return rows
}

export async function getCategoryID(category){
  const [rows] = await pool.query('Select categoryID from categories where categoryType = ?', [category]);
  console.log(rows)
  return rows
}

export async function getCourseID(course){
    const [rows] = await pool.query('Select courseID from courses WHERE coursecode = ?',[course]);
    console.log(rows)
    return rows
}

export async function getDurationID(duration) {
  const [rows] = await pool.query('SELECT durationID FROM durations WHERE duration = ?', [duration]);
  console.log(rows);
  return rows;
}

export async function insertQuestions( categoryID ,locationID, durationID, courseID, notes, date) {
  try {
    const [rows] = await pool.query(`
      INSERT INTO questions (categoryID, locationID, durationID, courseID, notes, dateOfQuestion, userID)
      VALUES (?, ?, ?, ?, ?, ?, null)
    `, [categoryID,locationID, durationID, courseID, notes, date]);
    console.log(rows);
    return rows;
  } catch (error) {
    console.error('Error inserting question:', error);
    throw error;
  }
}

export async function createUser(firstName, lastName, email, password, role) {
  const [rows] = await pool.query(`
    INSERT INTO users (firstName, lastName, email, password,  userRoleID)
    VALUES (?, ?, ?, ?, ?)
  `, [firstName, lastName, email, password, role]);
  console.log(rows);
  return rows;
}

export async function deleteUser(email) {
  const [rows] = await pool.query(`
    DELETE FROM users
    WHERE email = ?
  `, [email]);
  console.log(rows);
  return rows;
}

