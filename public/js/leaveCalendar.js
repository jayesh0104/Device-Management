// Add this to your script
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      plugins: ['dayGrid'],
      events: '/admin/dateLeaves', // Endpoint to fetch leave events
      dateClick: function(info) {
        // Handle date click event
        console.log('Date clicked:', info.dateStr);
      }
    });
  
    calendar.render();
  });
  