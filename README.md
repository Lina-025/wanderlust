# Tour Booking System

A comprehensive software solution developed for the **CE302 Advanced Software Engineering** course. This system facilitates seamless tour management and booking processes, applying core software engineering principles and robust system design.

## Table of Contents
* [Description](#description)
* [Features](#features)
* [Project Structure](#project-structure)
* [Database Design](#database-design)
* [Security](#security)
* [Team Members](#team-members)
* [Getting Started](#getting-started)

## Description
The **Tour Booking System** is designed to bridge the gap between customers and administrators in the travel industry. It allows customers to efficiently browse, book, and manage their travel plans, while providing administrators with the tools necessary to maintain tour listings and monitor reservations.

## Features
### User (Customer)
* **Login and Registration**: Secure account creation and authentication.
* **Browse Tours**: View available tour packages and details.
* **Book Tours**: Select dates and participants to secure a reservation.
* **Cancel Bookings**: Manage personal travel history by cancelling upcoming trips.

### Admin
* **Tour Management**: Full CRUD (Create, Read, Update, Delete) capabilities for tour listings.
* **Reservation Overview**: Access and view all bookings made within the system.

## Project Structure
The project follows a modular architecture to ensure separation of concerns:
* **model**: Contains the data structures and business entities.
* **service**: Implements the core logic and functional processing.
* **ui**: Manages the user interface and presentation layer.

## Database Design
Data is persisted using **localStorage** to simulate a flat-file database environment. The system utilizes the following keys:
* `wl_users`: Stores user credentials and profile data.
* `wl_tours`: Contains information regarding available tour packages.
* `wl_bookings`: Tracks all transaction and reservation records.

## Security
To ensure data integrity and user privacy:
* **Password Hashing**: Passwords are never stored in plain text. They are processed using the **SHA-256** algorithm via the Web Crypto API before being saved.
* **Access Control**: A dedicated navigation handler manages permissions, ensuring that admin panels are restricted to authorized personnel only.

## Team Members
This project was successfully completed by:
* Sarah Joujou
* Sahar Abdulrahim
* Masudah Ghulam Akbar
* Lina Boukrouh

## Getting Started
1. Clone the repository to your local machine.
2. Open `index.html` in any modern web browser.
3. Use the following default credentials for testing:
   * **Admin**: admin@wanderlust.com | Password: admin
   * **User**: santa@example.com | Password: password