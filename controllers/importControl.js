import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import xml2js from 'xml2js';
import xlsx from 'xlsx';
import { getLocationID, getCourseID, getDurationID, insertQuestions , getCategoryID } from '../models/database.js';
import { getJsDateFromExcel }  from 'excel-date-to-js';

export const importData = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.render("Import.ejs", { error: 'No file was uploaded.' });
  }

  const supportedFormats = ['.csv', '.xml', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!supportedFormats.includes(fileExtension)) {
    fs.unlinkSync(file.path);
    return res.render("Import.ejs", { error: 'Unsupported file format. Please upload a CSV, XML, or Excel file.' });
  }

  const data = await parseFile(file.path, fileExtension);

  for (const record of data) {
    const { location, duration , category , course, notes, date } = record;
    const [month, day, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;

    const [locationID] = await getLocationID(location);
    const [durationID] = await getDurationID(duration);
    const [categoryID] = await getCategoryID(category);
    const [courseID] = await getCourseID(course);
    
    if (locationID && durationID && courseID && categoryID) {
      await insertQuestions(categoryID.categoryID,locationID.locationID, durationID.durationID, courseID.courseID, notes, formattedDate);
    }
  }

  fs.unlinkSync(file.path);
  res.render("Import.ejs", { message: 'Data imported successfully.' });
};

async function parseFile(filePath, fileExtension) {
  if (fileExtension === '.csv') {
    return await parseCsvFile(filePath);
  } else if (fileExtension === '.xml') {
    return await parseXmlFile(filePath);
  } else if (fileExtension === '.xlsx') {
    return await parseExcelFile(filePath);
  }
}

function parseCsvFile(filePath) { //
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', (row) => {
        if (row.length === 6) {
          const [location, duration, category, course, notes, date] = row;
          data.push({ location,category, duration, course, notes, date });
        }
      })
      .on('end', () => resolve(data));
  });
}

function parseXmlFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, xmlData) => {
        if (err) {
          reject(err);
        } else {
          xml2js.parseString(xmlData, (err, result) => {
            if (err) {
              reject(err);
            } else {
              const entries = result.root.row;
              const data = entries.map((entry) => ({
                location: entry.Location[0],
                duration: entry.Duration[0],
                category: entry.Category[0],
                course: entry.Course[0],
                notes: entry.Notes[0],
                date: entry.Date[0],
              }));
              resolve(data);
            }
          });
        }
      });
    });
  }

function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
    .slice(1)
    .map((row) => ({
      location: row[0],
      duration: row[1],
      category: row[2],
      course: row[3],
      notes: row[4],
      date: exceldateToString(row[5]),
    }));
  return data;
}

function exceldateToString(excelDate){
  let date=getJsDateFromExcel(excelDate);
  date=JSON.stringify(date);
  date =date.substring( 1, date.indexOf("T"));
  date = date.substring(date.indexOf("-")+1,date.lastIndexOf("-"))+"/"+ date.substring(date.lastIndexOf("-")+1,date.length) +"/"+ date.substring(0,date.indexOf("-"));
  return date;
}