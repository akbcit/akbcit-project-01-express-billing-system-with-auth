Assignment:  P01 – Express Billing with Auth – Finale

Course Value:  40%

Assignment Description:

Continuing on with the code from A03, add Authentication and Role-Based Authorization as well as refine the design.

Teamwork:

For this final project you will be working solo.

Instructions:

    Fork your A03 Express Billing application
        You should be working with your own database for this stage
    Add support for authentication and authorization
    Personalize the styling
    When you have completed this assignment, to upload it to the Learning Hub
    Remember to delete the node_modules before zipping up and submitting your work.
    In order to verify your database and mitigate any IP address restrictions you must create a database user with the username jsolomon and the role Atlas Admin, and provide me the password in the Submission comments on Learning Hub.  Using weak passwords will result in a point deduction.

 

Functional Specifications 

For this final project the specifications are intentionally quite loosely defined. 

This is MUCH more like what you will be expected to work from as a professional developer.

Your app must have all of the functionality that has been built in the previous stages of the Express Billing assignments, as well as the following role-based access controls:

    Un-authenticated users
        View the home page
        Register
        Login 
    Authenticated users 
        View their own user info
        Edit their own user info, except for roles
        View their own Invoices
    Managers 
        View all Users
        Edit all existing Users, except for roles
        View all Invoices
        Create Invoices
        Mark invoices as "paid"
    Admins
        All of the above, plus
            Add Users
            Edit User Roles
            Add, edit, and delete Products

 

Screenshots and Movie Demos

    For this stage of the project no demos will be provided.  
    Use your best judgment

Marking Criteria:

    This project will be marked out of 40 based on the following criteria:
        All functional specifications met:      30

        UI and styling of your application:    10
