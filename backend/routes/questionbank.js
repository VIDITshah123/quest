/**
 * Question Bank API Routes
 * Created: 2025-07-30
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// Helper function to handle database errors
const handleDBError = (err, res) => {
  console.error('Database error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Database operation failed',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * COMPANIES ROUTES
 */

// Get all companies
router.get('/companies', [authenticateToken], async (req, res) => {
  try {
    const companies = await dbMethods.all('SELECT * FROM qb_master_companies WHERE is_active = 1');
    res.json({ success: true, data: companies });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create a new company
router.post('/companies', [
  authenticateToken,
  body('company_name').notEmpty().withMessage('Company name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { company_name, company_gst_number, company_city, company_state, company_country, company_pincode, company_address } = req.body;
    
    const result = await dbMethods.run(
      'INSERT INTO qb_master_companies (company_name, company_gst_number, company_city, company_state, company_country, company_pincode, company_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [company_name, company_gst_number, company_city, company_state, company_country, company_pincode, company_address]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Company created successfully',
      company_id: result.lastID 
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update a company
router.put('/companies/:id', [
  authenticateToken,
  body('company_name').optional().notEmpty().withMessage('Company name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const companyId = req.params.id;
    const { company_name, company_gst_number, company_city, company_state, company_country, company_pincode, company_address, is_active } = req.body;
    
    const updates = [];
    const params = [];
    
    if (company_name !== undefined) { updates.push('company_name = ?'); params.push(company_name); }
    if (company_gst_number !== undefined) { updates.push('company_gst_number = ?'); params.push(company_gst_number); }
    if (company_city !== undefined) { updates.push('company_city = ?'); params.push(company_city); }
    if (company_state !== undefined) { updates.push('company_state = ?'); params.push(company_state); }
    if (company_country !== undefined) { updates.push('company_country = ?'); params.push(company_country); }
    if (company_pincode !== undefined) { updates.push('company_pincode = ?'); params.push(company_pincode); }
    if (company_address !== undefined) { updates.push('company_address = ?'); params.push(company_address); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE qb_master_companies SET ${updates.join(', ')} WHERE company_id = ?`;
    params.push(companyId);
    
    const result = await dbMethods.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    res.json({ success: true, message: 'Company updated successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Delete a company (soft delete)
router.delete('/companies/:id', [authenticateToken], async (req, res) => {
  try {
    const result = await dbMethods.run(
      'UPDATE qb_master_companies SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE company_id = ?',
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * EMPLOYEES ROUTES
 */

// Get all employees
router.get('/employees', [authenticateToken], async (req, res) => {
  try {
    const employees = await dbMethods.all('SELECT * FROM qb_master_employees WHERE is_active = 1');
    res.json({ success: true, data: employees });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create a new employee
router.post('/employees', [
  authenticateToken,
  body('employee_name').notEmpty().withMessage('Employee name is required'),
  body('employee_email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_name, employee_email } = req.body;
    
    const result = await dbMethods.run(
      'INSERT INTO qb_master_employees (employee_name, employee_email) VALUES (?, ?)',
      [employee_name, employee_email]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Employee created successfully',
      employee_id: result.lastID 
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update an employee
router.put('/employees/:id', [
  authenticateToken,
  body('employee_name').optional().notEmpty().withMessage('Employee name cannot be empty'),
  body('employee_email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const employeeId = req.params.id;
    const { employee_name, employee_email, is_active } = req.body;
    
    const updates = [];
    const params = [];
    
    if (employee_name !== undefined) { updates.push('employee_name = ?'); params.push(employee_name); }
    if (employee_email !== undefined) { updates.push('employee_email = ?'); params.push(employee_email); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE qb_master_employees SET ${updates.join(', ')} WHERE employee_id = ?`;
    params.push(employeeId);
    
    const result = await dbMethods.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Delete an employee (soft delete)
router.delete('/employees/:id', [authenticateToken], async (req, res) => {
  try {
    const result = await dbMethods.run(
      'UPDATE qb_master_employees SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ?',
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * QUESTIONS ROUTES
 */

// Get all questions with filters
router.get('/questions', [authenticateToken], async (req, res) => {
  try {
    const { category_id, subcategory_id, difficulty, type, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM qb_master_questions WHERE is_active = 1';
    const params = [];
    
    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }
    
    if (subcategory_id) {
      query += ' AND subcategory_id = ?';
      params.push(subcategory_id);
    }
    
    if (difficulty) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty);
    }
    
    if (type) {
      query += ' AND question_type = ?';
      params.push(type);
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const questions = await dbMethods.all(query, params);
    res.json({ success: true, data: questions });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create a new question
router.post('/questions', [
  authenticateToken,
  body('question_text').notEmpty().withMessage('Question text is required'),
  body('question_writer_id').isInt().withMessage('Valid writer ID is required'),
  body('question_type').optional().isIn(['mcq', 'true_false']).withMessage('Invalid question type'),
  body('difficulty_level').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      question_text, 
      question_writer_id, 
      category_id, 
      subcategory_id, 
      question_type = 'mcq', 
      question_instructions, 
      difficulty_level 
    } = req.body;
    
    const result = await dbMethods.run(
      `INSERT INTO qb_master_questions 
       (question_text, question_writer_id, category_id, subcategory_id, question_type, question_instructions, difficulty_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [question_text, question_writer_id, category_id, subcategory_id, question_type, question_instructions, difficulty_level]
    );

    // If options are provided for MCQ, add them
    if (question_type === 'mcq' && Array.isArray(req.body.options)) {
      const questionId = result.lastID;
      const options = req.body.options;
      
      for (const option of options) {
        await dbMethods.run(
          'INSERT INTO qb_question_answer_options (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)',
          [questionId, option.text, option.is_correct || false, option.order || 0]
        );
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Question created successfully',
      question_id: result.lastID 
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Get question by ID with options
router.get('/questions/:id', [authenticateToken], async (req, res) => {
  try {
    const question = await dbMethods.get(
      'SELECT * FROM qb_master_questions WHERE question_id = ? AND is_active = 1',
      [req.params.id]
    );
    
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    // Get options if question is MCQ
    if (question.question_type === 'mcq') {
      const options = await dbMethods.all(
        'SELECT * FROM qb_question_answer_options WHERE question_id = ? ORDER BY option_order',
        [question.question_id]
      );
      question.options = options;
    }
    
    res.json({ success: true, data: question });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update a question
router.put('/questions/:id', [
  authenticateToken,
  body('question_text').optional().notEmpty().withMessage('Question text cannot be empty'),
  body('question_type').optional().isIn(['mcq', 'true_false']).withMessage('Invalid question type'),
  body('difficulty_level').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const questionId = req.params.id;
    const { 
      question_text, 
      category_id, 
      subcategory_id, 
      question_type, 
      question_instructions, 
      difficulty_level,
      options
    } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (question_text !== undefined) { updates.push('question_text = ?'); params.push(question_text); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (subcategory_id !== undefined) { updates.push('subcategory_id = ?'); params.push(subcategory_id); }
    if (question_type !== undefined) { updates.push('question_type = ?'); params.push(question_type); }
    if (question_instructions !== undefined) { updates.push('question_instructions = ?'); params.push(question_instructions); }
    if (difficulty_level !== undefined) { updates.push('difficulty_level = ?'); params.push(difficulty_level); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE qb_master_questions SET ${updates.join(', ')} WHERE question_id = ?`;
    params.push(questionId);
    
    const result = await dbMethods.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    // Update options if provided
    if (Array.isArray(options)) {
      // Delete existing options
      await dbMethods.run('DELETE FROM qb_question_answer_options WHERE question_id = ?', [questionId]);
      
      // Insert new options
      for (const option of options) {
        await dbMethods.run(
          'INSERT INTO qb_question_answer_options (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)',
          [questionId, option.text, option.is_correct || false, option.order || 0]
        );
      }
    }
    
    res.json({ success: true, message: 'Question updated successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Delete a question (soft delete)
router.delete('/questions/:id', [authenticateToken], async (req, res) => {
  try {
    const result = await dbMethods.run(
      'UPDATE qb_master_questions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE question_id = ?',
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * CATEGORIES ROUTES
 */

// Get all categories with question counts
router.get('/categories', [authenticateToken], async (req, res) => {
  try {
    const categories = await dbMethods.all(`
      SELECT 
        c.*, 
        (SELECT COUNT(*) FROM qb_master_questions q 
         WHERE q.category_id = c.category_id AND q.is_active = 1) as question_count
      FROM qb_master_categories c
      ORDER BY c.category_name
    `);
    res.json({ success: true, data: categories });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create a new category
router.post('/categories', [
  authenticateToken,
  body('category_name').notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category_name, category_description } = req.body;
    
    const result = await dbMethods.run(
      'INSERT INTO qb_master_categories (category_name, category_description) VALUES (?, ?)',
      [category_name, category_description]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully',
      category_id: result.lastID 
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update a category
router.put('/categories/:id', [
  authenticateToken,
  body('category_name').optional().notEmpty().withMessage('Category name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const categoryId = req.params.id;
    const { category_name, category_description } = req.body;
    
    const updates = [];
    const params = [];
    
    if (category_name !== undefined) { updates.push('category_name = ?'); params.push(category_name); }
    if (category_description !== undefined) { updates.push('category_description = ?'); params.push(category_description); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    const query = `UPDATE qb_master_categories SET ${updates.join(', ')} WHERE category_id = ?`;
    params.push(categoryId);
    
    const result = await dbMethods.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Delete a category
router.delete('/categories/:id', [authenticateToken], async (req, res) => {
  try {
    // Check if category has subcategories
    const subcategories = await dbMethods.all(
      'SELECT COUNT(*) as count FROM qb_master_subcategories WHERE category_id = ?',
      [req.params.id]
    );
    
    if (subcategories[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with existing subcategories' 
      });
    }
    
    // Check if category is used in questions
    const questions = await dbMethods.all(
      'SELECT COUNT(*) as count FROM qb_master_questions WHERE category_id = ? AND is_active = 1',
      [req.params.id]
    );
    
    if (questions[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category that is being used by questions' 
      });
    }
    
    // If no dependencies, delete the category
    const result = await dbMethods.run(
      'DELETE FROM qb_master_categories WHERE category_id = ?',
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * SUBCATEGORIES ROUTES
 */

// Get all subcategories for a category
router.get('/categories/:categoryId/subcategories', [authenticateToken], async (req, res) => {
  try {
    const subcategories = await dbMethods.all(
      'SELECT * FROM qb_master_subcategories WHERE category_id = ?',
      [req.params.categoryId]
    );
    
    res.json({ success: true, data: subcategories });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create a new subcategory
router.post('/categories/:categoryId/subcategories', [
  authenticateToken,
  body('subcategory_name').notEmpty().withMessage('Subcategory name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { subcategory_name, subcategory_description } = req.body;
    const category_id = req.params.categoryId;
    
    const result = await dbMethods.run(
      'INSERT INTO qb_master_subcategories (category_id, subcategory_name, subcategory_description) VALUES (?, ?, ?)',
      [category_id, subcategory_name, subcategory_description]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Subcategory created successfully',
      subcategory_id: result.lastID 
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update a subcategory
router.put('/subcategories/:id', [
  authenticateToken,
  body('subcategory_name').optional().notEmpty().withMessage('Subcategory name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const subcategoryId = req.params.id;
    const { subcategory_name, subcategory_description } = req.body;
    
    const updates = [];
    const params = [];
    
    if (subcategory_name !== undefined) { updates.push('subcategory_name = ?'); params.push(subcategory_name); }
    if (subcategory_description !== undefined) { updates.push('subcategory_description = ?'); params.push(subcategory_description); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    const query = `UPDATE qb_master_subcategories SET ${updates.join(', ')} WHERE subcategory_id = ?`;
    params.push(subcategoryId);
    
    const result = await dbMethods.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }
    
    res.json({ success: true, message: 'Subcategory updated successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Delete a subcategory
router.delete('/subcategories/:id', [authenticateToken], async (req, res) => {
  try {
    // Check if subcategory is used in questions
    const questions = await dbMethods.all(
      'SELECT COUNT(*) as count FROM qb_master_questions WHERE subcategory_id = ? AND is_active = 1',
      [req.params.id]
    );
    
    if (questions[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete subcategory that is being used by questions' 
      });
    }
    
    // If no dependencies, delete the subcategory
    const result = await dbMethods.run(
      'DELETE FROM qb_master_subcategories WHERE subcategory_id = ?',
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }
    
    res.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * COMPANY DETAILS ROUTES
 */

// Get company details by company ID
router.get('/companies/:id/details', [authenticateToken], async (req, res) => {
  try {
    const details = await dbMethods.get(
      'SELECT * FROM qb_company_details WHERE company_id = ?', 
      [req.params.id]
    );
    
    if (!details) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company details not found' 
      });
    }
    
    res.json({ success: true, data: details });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create or update company details
router.put('/companies/:id/details', [
  authenticateToken,
  body('contact_person').optional().isString(),
  body('contact_email').optional().isEmail(),
  body('contact_phone').optional().isString(),
  body('industry').optional().isString(),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { contact_person, contact_email, contact_phone, industry, website } = req.body;
    
    // Check if company exists
    const company = await dbMethods.get(
      'SELECT company_id FROM qb_master_companies WHERE company_id = ? AND is_active = 1', 
      [req.params.id]
    );
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found or inactive' 
      });
    }

    // Check if details already exist
    const existingDetails = await dbMethods.get(
      'SELECT * FROM qb_company_details WHERE company_id = ?', 
      [req.params.id]
    );

    let result;
    if (existingDetails) {
      // Update existing details
      result = await dbMethods.run(
        `UPDATE qb_company_details 
         SET contact_person = COALESCE(?, contact_person),
             contact_email = COALESCE(?, contact_email),
             contact_phone = COALESCE(?, contact_phone),
             industry = COALESCE(?, industry),
             website = COALESCE(?, website),
             updated_at = CURRENT_TIMESTAMP
         WHERE company_id = ?`,
        [contact_person, contact_email, contact_phone, industry, website, req.params.id]
      );
    } else {
      // Insert new details
      result = await dbMethods.run(
        `INSERT INTO qb_company_details 
         (company_id, contact_person, contact_email, contact_phone, industry, website)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, contact_person, contact_email, contact_phone, industry, website]
      );
    }

    const updatedDetails = await dbMethods.get(
      'SELECT * FROM qb_company_details WHERE company_id = ?', 
      [req.params.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Company details saved successfully',
      data: updatedDetails
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * EMPLOYEE DETAILS ROUTES
 */

// Get employee details by employee ID
router.get('/employees/:id/details', [authenticateToken], async (req, res) => {
  try {
    const details = await dbMethods.get(
      `SELECT d.*, e.email, e.role 
       FROM qb_employee_details d
       JOIN qb_master_employees e ON d.employee_id = e.employee_id
       WHERE d.employee_id = ? AND e.is_active = 1`,
      [req.params.id]
    );
    
    if (!details) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee details not found or employee is inactive' 
      });
    }
    
    res.json({ success: true, data: details });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Create or update employee details
router.put('/employees/:id/details', [
  authenticateToken,
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('phone_number').optional().isString(),
  body('department').optional().isString(),
  body('position').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { first_name, last_name, phone_number, department, position } = req.body;
    
    // Check if employee exists and is active
    const employee = await dbMethods.get(
      'SELECT employee_id FROM qb_master_employees WHERE employee_id = ? AND is_active = 1', 
      [req.params.id]
    );
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found or inactive' 
      });
    }

    // Check if details already exist
    const existingDetails = await dbMethods.get(
      'SELECT * FROM qb_employee_details WHERE employee_id = ?', 
      [req.params.id]
    );

    let result;
    if (existingDetails) {
      // Update existing details
      result = await dbMethods.run(
        `UPDATE qb_employee_details 
         SET first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             phone_number = COALESCE(?, phone_number),
             department = COALESCE(?, department),
             position = COALESCE(?, position),
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = ?`,
        [first_name, last_name, phone_number, department, position, req.params.id]
      );
    } else {
      // Insert new details
      result = await dbMethods.run(
        `INSERT INTO qb_employee_details 
         (employee_id, first_name, last_name, phone_number, department, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, first_name, last_name, phone_number, department, position]
      );
    }

    const updatedDetails = await dbMethods.get(
      `SELECT d.*, e.email, e.role 
       FROM qb_employee_details d
       JOIN qb_master_employees e ON d.employee_id = e.employee_id
       WHERE d.employee_id = ?`,
      [req.params.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Employee details saved successfully',
      data: updatedDetails
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * QUESTION OPTIONS ROUTES
 */

// Get all options for a question
router.get('/questions/:id/options', [authenticateToken], async (req, res) => {
  try {
    const options = await dbMethods.all(
      'SELECT * FROM qb_question_answer_options WHERE question_id = ? ORDER BY option_order',
      [req.params.id]
    );
    
    res.json({ success: true, data: options });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Update question options (replaces all options for the question)
router.put('/questions/:id/options', [
  authenticateToken,
  body().isArray().withMessage('Options must be an array'),
  body('*.option_text').isString().withMessage('Option text is required'),
  body('*.is_correct').isBoolean().withMessage('is_correct must be a boolean'),
  body('*.option_order').isInt({ min: 1 }).withMessage('Valid option order is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const questionId = req.params.id;
    const options = req.body;

    // Verify question exists and is active
    const question = await dbMethods.get(
      'SELECT question_id FROM qb_master_questions WHERE question_id = ? AND is_active = 1',
      [questionId]
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or inactive'
      });
    }

    // Use transaction to ensure all operations succeed or fail together
    await dbMethods.run('BEGIN TRANSACTION');
    
    try {
      // Delete existing options
      await dbMethods.run(
        'DELETE FROM qb_question_answer_options WHERE question_id = ?',
        [questionId]
      );

      // Insert new options
      for (const option of options) {
        await dbMethods.run(
          `INSERT INTO qb_question_answer_options 
           (question_id, option_text, is_correct, option_order)
           VALUES (?, ?, ?, ?)`,
          [questionId, option.option_text, option.is_correct ? 1 : 0, option.option_order]
        );
      }

      await dbMethods.run('COMMIT');
      
      // Get updated options
      const updatedOptions = await dbMethods.all(
        'SELECT * FROM qb_question_answer_options WHERE question_id = ? ORDER BY option_order',
        [questionId]
      );
      
      res.json({
        success: true,
        message: 'Question options updated successfully',
        data: updatedOptions
      });
    } catch (err) {
      await dbMethods.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * VOTING SYSTEM ROUTES
 */

// Submit a vote for a question
router.post('/questions/:id/vote', [
  authenticateToken,
  body('vote_type').isIn(['upvote', 'downvote']).withMessage('Invalid vote type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const questionId = req.params.id;
    const voterId = req.user.id; // Assuming user ID is stored in req.user.id
    const { vote_type } = req.body;

    // Verify question exists and is active
    const question = await dbMethods.get(
      'SELECT question_id FROM qb_master_questions WHERE question_id = ? AND is_active = 1',
      [questionId]
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or inactive'
      });
    }

    // Check if user has already voted
    const existingVote = await dbMethods.get(
      'SELECT vote_type FROM qb_question_votes WHERE question_id = ? AND voter_id = ?',
      [questionId, voterId]
    );

    await dbMethods.run('BEGIN TRANSACTION');
    
    try {
      if (existingVote) {
        // Update existing vote if different
        if (existingVote.vote_type !== vote_type) {
          // Remove previous vote from score
          await dbMethods.run(
            `UPDATE qb_question_scores 
             SET ${existingVote.vote_type === 'upvote' ? 'upvotes' : 'downvotes'} = 
                 ${existingVote.vote_type === 'upvote' ? 'upvotes' : 'downvotes'} - 1
             WHERE question_id = ?`,
            [questionId]
          );
          
          // Add new vote to score
          await dbMethods.run(
            `UPDATE qb_question_scores 
             SET ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} = 
                 ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} + 1
             WHERE question_id = ?`,
            [questionId]
          );
          
          // Update vote record
          await dbMethods.run(
            'UPDATE qb_question_votes SET vote_type = ? WHERE question_id = ? AND voter_id = ?',
            [vote_type, questionId, voterId]
          );
        }
      } else {
        // Add new vote to score
        await dbMethods.run(
          `INSERT OR IGNORE INTO qb_question_scores (question_id, base_score, upvotes, downvotes)
           VALUES (?, 100, 0, 0)`,
          [questionId]
        );
        
        await dbMethods.run(
          `UPDATE qb_question_scores 
           SET ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} = 
               ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} + 1
           WHERE question_id = ?`,
          [questionId]
        );
        
        // Create new vote record
        await dbMethods.run(
          'INSERT INTO qb_question_votes (question_id, voter_id, vote_type) VALUES (?, ?, ?)',
          [questionId, voterId, vote_type]
        );
      }
      
      await dbMethods.run('COMMIT');
      
      // Get updated score
      const score = await dbMethods.get(
        'SELECT * FROM qb_question_scores WHERE question_id = ?',
        [questionId]
      );
      
      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          question_id: parseInt(questionId),
          total_score: score ? score.total_score : 100,
          upvotes: score ? score.upvotes : 0,
          downvotes: score ? score.downvotes : 0
        }
      });
    } catch (err) {
      await dbMethods.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    handleDBError(err, res);
  }
});

// Get vote count for a question
router.get('/questions/:id/votes', [authenticateToken], async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const score = await dbMethods.get(
      'SELECT * FROM qb_question_scores WHERE question_id = ?',
      [questionId]
    );
    
    res.json({
      success: true,
      data: {
        question_id: parseInt(questionId),
        total_score: score ? score.total_score : 100,
        upvotes: score ? score.upvotes : 0,
        downvotes: score ? score.downvotes : 0
      }
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Get user's vote for a question
router.get('/questions/:id/my-vote', [authenticateToken], async (req, res) => {
  try {
    const questionId = req.params.id;
    const voterId = req.user.id; // Assuming user ID is stored in req.user.id
    
    const vote = await dbMethods.get(
      'SELECT vote_type FROM qb_question_votes WHERE question_id = ? AND voter_id = ?',
      [questionId, voterId]
    );
    
    res.json({
      success: true,
      data: {
        question_id: parseInt(questionId),
        has_voted: !!vote,
        vote_type: vote ? vote.vote_type : null
      }
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

/**
 * AUDIT LOG ROUTES
 */

// Get question edit history
router.get('/questions/:id/edits', [
  authenticateToken,
  checkPermissions('view_audit_logs')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Get edit history with pagination
    const edits = await dbMethods.all(
      `SELECT e.*, 
              u.email as editor_email, 
              u.first_name || ' ' || u.last_name as editor_name
       FROM qb_audit_question_edits e
       JOIN qb_master_employees u ON e.editor_id = u.employee_id
       WHERE e.question_id = ?
       ORDER BY e.edit_timestamp DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );
    
    // Get total count for pagination
    const count = await dbMethods.get(
      'SELECT COUNT(*) as total FROM qb_audit_question_edits WHERE question_id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      data: edits,
      pagination: {
        total: count ? count.total : 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Log a question edit (internal use by other routes)
const logQuestionEdit = async (questionId, editorId, oldText, newText) => {
  try {
    await dbMethods.run(
      `INSERT INTO qb_audit_question_edits 
       (question_id, editor_id, old_question_text, new_question_text)
       VALUES (?, ?, ?, ?)`,
      [questionId, editorId, oldText, newText]
    );
  } catch (err) {
    console.error('Failed to log question edit:', err);
  }
};

// Get employee activity logs
router.get('/employees/:id/activities', [
  authenticateToken,
  checkPermissions('view_audit_logs')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let query = `SELECT * FROM qb_audit_employee_activities 
                 WHERE employee_id = ?`;
    let params = [id];
    
    // Add filters if provided
    if (activity_type) {
      query += ' AND activity_type = ?';
      params.push(activity_type);
    }
    
    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(new Date(end_date).toISOString());
    }
    
    // Add sorting and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Get activities with filters
    const activities = await dbMethods.all(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM qb_audit_employee_activities WHERE employee_id = ?';
    let countParams = [id];
    
    if (activity_type) {
      countQuery += ' AND activity_type = ?';
      countParams.push(activity_type);
    }
    
    if (start_date) {
      countQuery += ' AND created_at >= ?';
      countParams.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      countQuery += ' AND created_at <= ?';
      countParams.push(new Date(end_date).toISOString());
    }
    
    const count = await dbMethods.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: activities,
      pagination: {
        total: count ? count.total : 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    handleDBError(err, res);
  }
});

// Log employee activity (internal use by other routes)
const logEmployeeActivity = async (employeeId, activityType, details, req) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    await dbMethods.run(
      `INSERT INTO qb_audit_employee_activities 
       (employee_id, activity_type, activity_details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [employeeId, activityType, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Failed to log employee activity:', err);
  }
};

// Add middleware to log all requests
router.use((req, res, next) => {
  // Skip logging for certain paths
  const skipLogging = [
    '/api/questionbank/questions/:id/votes',
    '/api/questionbank/questions/:id/my-vote'
  ];
  
  if (skipLogging.some(path => req.path.includes(path))) {
    return next();
  }
  
  // Log the request
  if (req.user && req.user.id) {
    logEmployeeActivity(
      req.user.id,
      'api_request',
      {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
      },
      req
    );
  }
  
  next();
});

module.exports = router;
