# Question Bank Management System - Product Requirements Document (PRD)

## 1. Introduction
A web application for managing and collaborating on multiple-choice questions (MCQs) with role-based access control.

## 2. User Roles

### 2.1 Admin
- Can view all companies
- Can add new companies

### 2.2 Company
- View all questions
- Manage employees:
  - Add new employees
  - Remove employees
  - Assign/change employee roles (question_writer/Reviewer)

### 2.3 Employee Roles

#### question_writer
- Add new questions
- Edit own questions
- Delete own questions
- View all questions (own and others')
- Upvote/downvote questions others questions
- Categorize questions with categories and subcategories
- Questions can have single or multiple correct answers
- Limited to one vote (up/down) per question
- question_writer should see the questions that are invalidated and reasons for those 
- question_writer should see the score for each question
- question_writer should see the leaderboard by score of questions
- question_writer should see the leaderboard by score of employees


#### Reviewer
- View all questions
- Upvote/downvote questions
- Cannot add/edit/delete questions
- If a reviewer finds a question inappropriate, they can mark it as invalid and provide a reason for the invalidation


## 3. Question Management

### 3.1 Question Structure
- Type: Multiple Choice Questions (MCQs) only
- Options per question:
  - Minimum: 2 options
  - Maximum: 6 options
  - Can have single or multiple correct answers

### 3.2 Question Scoring
- Each question starts with: 10 points
- Voting impact:
  - One upvote: Adds 1 point to the question's total score
  - One downvote: Subtracts 1 point from the question's total score
- The score is calculated as: Initial points (10) + (Number of upvotes) - (Number of downvotes)

## 4. Features

### 4.1 Dashboard
- Display questions sorted by score (highest to lowest)
- Hover functionality to show:
  - Question creation timestamp
  - Name of the employee who created the question
- leaderboard by score of employees
- leaderboard by score of questions
### 4.2 Question Management
- Add new questions
- Edit existing questions (for question_writers, only their own)
- Delete questions (for question_writers, only their own)
- Categorization with categories and subcategories

### 4.3 Voting System
- One vote (up/down) per user per question
- Real-time point updates

## 5. Technical Requirements

### 5.1 Security
- Role-based access control
- Secure authentication
- Data validation

### 5.2 Performance
- Efficient question loading and searching
- Real-time updates for votes
- Responsive design for various screen sizes

## 6. Future Enhancements
- Question export/import functionality
- Advanced search and filtering
- Question tagging system
- Performance analytics
- Bulk question upload
- Question duplication detection

