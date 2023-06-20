const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Email Validation
exports.validateEmail = (email) => {
    // Using a regular expression for basic email validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Generate Access Token
exports.generateAccessToken = (userId) => {
    const secretKey = process.env.SECRET_KEY || "TECHOSTOSDENODEJSBACKEND"; // Secret key
    const payload = { id: userId };
    const options = { expiresIn: '24h' };
    return jwt.sign(payload, secretKey, options);
}

// Generate ids
exports.generateId = () => {
    const id = uuidv4();
    const sid = id.replace(/-/g, '').substring(0, 12);
    return sid;
}

// Calculate Endtime if start time and hours,minute are only given 

// Calculate end time
exports.calculateEndTime = (startTime, hours, minutes) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);

    let endHour = startHour + hours;
    let endMinute = startMinute + minutes;

    // Adjust end time if minutes exceed 60
    if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
    }

    // Format end time
    const formattedEndHour = endHour < 10 ? `0${endHour}` : `${endHour}`;
    const formattedEndMinute = endMinute < 10 ? `0${endMinute}` : `${endMinute}`;

    return `${formattedEndHour}:${formattedEndMinute}`;
};

// Calculate duration between start time and end time
exports.calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;

    // Adjust duration if minutes are negative
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }

    return { hours, minutes };
};
