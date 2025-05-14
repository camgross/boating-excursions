// Test date calculation for 2025 dates

// Function to test date calculations 
function getDayOfWeek(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    date: dateString,
    dayOfWeekNumber: dayOfWeek,
    dayName: dayNames[dayOfWeek],
    formatted: dateObj.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };
}

// Test June 2025 dates
console.log('Testing June 2025 dates:');
console.log(getDayOfWeek('2025-06-20'));
console.log(getDayOfWeek('2025-06-21'));
console.log(getDayOfWeek('2025-06-22'));
console.log(getDayOfWeek('2025-06-23'));
console.log(getDayOfWeek('2025-06-24'));

// Double check with date constructor
console.log('\nDouble checking with direct date construction:');
console.log('June 21, 2025:', new Date(2025, 5, 21).getDay(), '(0=Sunday, 6=Saturday)'); 