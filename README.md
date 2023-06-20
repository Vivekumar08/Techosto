# Techosto Backend Development (Node.js)

# Tech Stack
- Language: Node v14+
- Database: MongoDB
- ORM: MongoDB Native Driver
- Library: UUID and MongoDB ObjectID to generate unique IDs.

# Models

1. User:
    - name (String, required)
    - email (String, required, unique)
    - password (String, required)
    
3. Projects:
      - name (String, required)
      - description (String, required)
      - userId (ObjectId, required, reference to User)
      
5. Tasks:
      - name (String, required)
      - description (String, required)
      - projectId (ObjectId, required, reference to Project)
      - logTime (Array of Objects)
        - taskName (String, required)
        - logTime (Object)
        - hours (Number, required)
        - minutes (Number, required)
     
7. Time-entries:
     - projectId (ObjectId, required, reference to Project)
     - taskId (ObjectId, required, reference to Task)
     - userId (ObjectId, required, reference to User)
     - date (Date, required)
     - startTime (String, required)
     - endTime (String)
     - timeSpent (Object)
     - hours (Number, required)
     - minutes (Number, required)
     - tasks (Array of ObjectId, reference to Task)
     - billed (Boolean, default: false)
     - billable (Boolean, default: false)

# API Endpoints

1. User Collection:
    - POST /v1/auth/signup: Create a new user.
    - POST /v1/auth/signin: Sign in an existing user.
    - GET /v1/auth/me: Get the user information for the authenticated user.

2. Project Collection:
    - POST /v1/projects: Create a new project.
    - GET /v1/projects: Get all projects.
    
3. Task Collection:
    - POST /v1/tasks: Create a new task with associated log time.
    - GET /v1/tasks: Get all tasks.
    
4. Time Entry Collection:
    - POST /v1/time-entry: Create a new time entry.
    - GET /v1/time-entry: Get all time entries.
    - GET /v1/time-entry/:id/: Get a specific time entry by its ID.
    - PUT /v1/time-entry/:id/choose-tasks: Choose a task for specific time entry by its ID.
    - DELETE /v1/time-entry/:id/: Delete a specific time entry by its ID.
