const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbPath = path.join(__dirname, '..', 'db', 'questionbank01.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run SQL queries with promises
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

// Helper function to get a single row
const get = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

// Hash password helper
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Main function to seed sample data
const seedSampleData = async () => {
  try {
    // Start transaction
    await run('BEGIN TRANSACTION');

    console.log('Seeding sample data...');

    // 1. Create roles if they don't exist
    console.log('Creating roles...');
    await run("INSERT OR IGNORE INTO roles (name, description) VALUES ('admin', 'Administrator')");
    await run("INSERT OR IGNORE INTO roles (name, description) VALUES ('teacher', 'Teacher')");
    await run("INSERT OR IGNORE INTO roles (name, description) VALUES ('student', 'Student')");

    // Get role IDs
    const adminRole = await get("SELECT id FROM roles WHERE name = 'admin'");
    const teacherRole = await get("SELECT id FROM roles WHERE name = 'teacher'");
    const studentRole = await get("SELECT id FROM roles WHERE name = 'student'");

    // 2. Create permissions
    console.log('Creating permissions...');
    const permissions = [
      'user_view', 'user_create', 'user_edit', 'user_delete',
      'role_view', 'role_create', 'role_edit', 'role_delete',
      'permission_view', 'permission_edit',
      'attendance_view', 'attendance_manage'
    ];

    for (const permission of permissions) {
      await run(
        'INSERT OR IGNORE INTO permissions (name, description) VALUES (?, ?)',
        [permission, `${permission.replace('_', ' ')} permission`]
      );
    }

    // 3. Create admin user
    console.log('Creating admin user...');
    const adminPassword = await hashPassword('admin123');
    await run(
      'INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', 'admin@example.com', adminPassword, 'Admin', 'User', adminRole.id]
    );

    // 4. Create teachers
    console.log('Creating teacher users...');
    const teacher1Password = await hashPassword('teacher123');
    const teacher2Password = await hashPassword('teacher123');
    
    await run(
      'INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['teacher1', 'john.doe@school.edu', teacher1Password, 'John', 'Doe', teacherRole.id]
    );
    
    await run(
      'INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['teacher2', 'jane.smith@school.edu', teacher2Password, 'Jane', 'Smith', teacherRole.id]
    );

    // 5. Create students
    console.log('Creating student users...');
    const studentPasswords = await Promise.all(
      Array(10).fill().map(() => hashPassword('student123'))
    );

    const studentFirstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const studentLastNames = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Garcia', 'Harris', 'Lee', 'Martin', 'Wilson'];

    for (let i = 0; i < 10; i++) {
      await run(
        'INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `student${i + 1}`,
          `student${i + 1}@school.edu`,
          studentPasswords[i],
          studentFirstNames[i],
          studentLastNames[i],
          studentRole.id
        ]
      );
    }

    // 6. Create classes
    console.log('Creating classes...');
    const classes = [
      { name: 'Mathematics 101', description: 'Introduction to Mathematics' },
      { name: 'Physics 101', description: 'Introduction to Physics' },
      { name: 'Chemistry 101', description: 'Introduction to Chemistry' },
      { name: 'Biology 101', description: 'Introduction to Biology' },
      { name: 'Computer Science 101', description: 'Introduction to Computer Science' }
    ];

    const teacher1 = await get("SELECT id FROM users WHERE username = 'teacher1'");
    const teacher2 = await get("SELECT id FROM users WHERE username = 'teacher2'");

    for (let i = 0; i < classes.length; i++) {
      const teacherId = i % 2 === 0 ? teacher1.id : teacher2.id;
      await run(
        'INSERT INTO classes (name, description, teacher_id) VALUES (?, ?, ?)',
        [classes[i].name, classes[i].description, teacherId]
      );
    }

    // 7. Enroll students in classes
    console.log('Enrolling students in classes...');
    const allStudents = await new Promise((resolve, reject) => {
      db.all("SELECT id FROM users WHERE role_id = ?", [studentRole.id], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const allClasses = await new Promise((resolve, reject) => {
      db.all("SELECT id FROM classes", [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    // Enroll each student in 2-4 random classes
    for (const student of allStudents) {
      const numClasses = 2 + Math.floor(Math.random() * 3); // 2-4 classes per student
      const shuffledClasses = [...allClasses].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numClasses && i < shuffledClasses.length; i++) {
        await run(
          'INSERT INTO class_enrollments (class_id, student_id) VALUES (?, ?)',
          [shuffledClasses[i].id, student.id]
        );
      }
    }

    // 8. Create some attendance records
    console.log('Creating attendance records...');
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // For each class, create attendance records for the past month
    for (const classItem of allClasses) {
      const classStudents = await new Promise((resolve, reject) => {
        db.all(
          'SELECT student_id FROM class_enrollments WHERE class_id = ?', 
          [classItem.id], 
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      // Create records for the past 30 days
      for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setDate(today.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip weekends (optional)
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Generate an attendance code for this class and day
        const code = uuidv4().substring(0, 6).toUpperCase();
        const expiresAt = new Date(date);
        expiresAt.setHours(expiresAt.getHours() + 1);

        await run(
          'INSERT INTO attendance_codes (class_id, code, expires_at, created_by) VALUES (?, ?, ?, ?)',
          [classItem.id, code, expiresAt.toISOString(), classItem.teacher_id]
        );

        // Mark attendance for each student (randomly present, late, or absent)
        for (const student of classStudents) {
          // 80% chance of being present, 10% late, 10% absent
          const rand = Math.random();
          let status = 'present';
          if (rand > 0.9) status = 'absent';
          else if (rand > 0.8) status = 'late';

          // Only mark present/late students as having attended
          if (status !== 'absent') {
            await run(
              'INSERT INTO attendance_records (class_id, student_id, date, status, attendance_code) VALUES (?, ?, ?, ?, ?)',
              [classItem.id, student.student_id, dateStr, status, code]
            );
          }
        }
      }
    }

    // Commit transaction
    await run('COMMIT');
    console.log('Sample data seeded successfully!');

  } catch (error) {
    // Rollback on error
    await run('ROLLBACK');
    console.error('Error seeding sample data:', error);
  } finally {
    // Close the database connection
    db.close();
  }
};

// Run the seed function
seedSampleData();
