// CycleWise - Period Tracker JavaScript
class CycleWise {
  constructor() {
      this.initializeData();
      this.setupEventListeners();
      this.setupCalendar();
      this.loadData();
      this.updateUI();
      this.setupResourcesSection();
      this.setupAnimations();
      this.setupMobileNav();
  }

  initializeData() {
      this.cycles = [];
      this.selectedSymptoms = new Set();
      this.currentDate = new Date();
      this.displayDate = new Date();
  }

  setupEventListeners() {
      // Period logging
      document.getElementById('add-entry').addEventListener('click', () => this.addPeriodEntry());
      
      // Symptom chips
      document.querySelectorAll('.chip').forEach(chip => {
          chip.addEventListener('click', () => this.toggleSymptom(chip));
      });

      // Calendar navigation
      document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
      document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));

      // Phase cards
      document.querySelectorAll('.phase-card').forEach(card => {
          card.addEventListener('click', () => this.showPhaseDetails(card.dataset.phase));
      });

      // Mobile navigation
      const navBtn = document.querySelector('[data-nav-toggler]');
      const navbar = document.querySelector('[data-navbar]');
      const overlay = document.querySelector('[data-overlay]');
      const navLinks = document.querySelectorAll('[data-nav-link]');
      const closeBtn = document.querySelector('.nav-close-btn');

      const toggleMenu = () => {
          navbar.classList.toggle('active');
          overlay.classList.toggle('active');
          document.body.style.overflow = navbar.classList.contains('active') ? 'hidden' : '';
      };

      const closeMenu = () => {
          navbar.classList.remove('active');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
      };

      // Toggle menu on hamburger button click
      navBtn?.addEventListener('click', toggleMenu);

      // Close menu when clicking close button
      closeBtn?.addEventListener('click', closeMenu);

      // Close menu when clicking overlay
      overlay?.addEventListener('click', closeMenu);

      // Close menu when clicking nav links
      navLinks.forEach(link => {
          link.addEventListener('click', closeMenu);
      });

      // Close menu on scroll
      window.addEventListener('scroll', () => {
          if (navbar?.classList.contains('active')) {
              closeMenu();
          }
      });

      // Modal handling
      const modal = document.getElementById('resource-modal');
      const modalContent = document.getElementById('resource-content');
      const closeModal = document.querySelector('.close-modal');
      const mainContent = document.querySelector('.main-content');

      // Function to position modal near clicked element
      function openModalNearTrigger(event, modalContent) {
          const trigger = event.currentTarget;
          const triggerRect = trigger.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Calculate position
          const modalTop = triggerRect.top + scrollTop;
          
          // Scroll to the modal position
          window.scrollTo({
              top: modalTop - 100, // Offset to show some context
              behavior: 'smooth'
          });
      }

      // Open modal when clicking resource links
      document.querySelectorAll('.resource-link').forEach(link => {
          link.addEventListener('click', (e) => {
              e.preventDefault();
              
              // Add blur to main content
              mainContent.classList.add('modal-open');
              
              // Show modal
              modal.classList.add('active');
              
              // Position modal near clicked element
              openModalNearTrigger(e, modalContent);
          });
      });

      // Close modal when clicking close button
      closeModal.addEventListener('click', () => {
          modal.classList.remove('active');
          mainContent.classList.remove('modal-open');
      });

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.classList.remove('active');
              mainContent.classList.remove('modal-open');
          }
      });

      // Prevent modal content clicks from closing the modal
      modalContent.addEventListener('click', (e) => {
          e.stopPropagation();
      });

      // Handle escape key
      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains('active')) {
              modal.classList.remove('active');
              mainContent.classList.remove('modal-open');
          }
      });
  }

  toggleSymptom(chip) {
      chip.classList.toggle('active');
      const symptom = chip.dataset.symptom;
      if (this.selectedSymptoms.has(symptom)) {
          this.selectedSymptoms.delete(symptom);
      } else {
          this.selectedSymptoms.add(symptom);
      }
  }

  addPeriodEntry() {
      const startDateInput = document.getElementById('start-date').value;
      const endDateInput = document.getElementById('end-date').value;
      const customSymptoms = document.getElementById('symptoms').value;

      if (!startDateInput) {
          this.showNotification('Please enter a start date', 'error');
          return;
      }

      const entry = {
          startDate: new Date(startDateInput),
          endDate: endDateInput ? new Date(endDateInput) : null,
          symptoms: [...this.selectedSymptoms],
          customSymptoms: customSymptoms.split(',').map(s => s.trim()).filter(s => s)
      };

      // Clear existing cycles and add the new one
      this.cycles = [entry];
      this.saveCycles();
      this.updatePredictions();
      this.updateCalendar();
      this.updateHistory();

      // Calculate and show current phase
      const currentPhase = this.calculateCurrentPhase(startDateInput, endDateInput);
      this.showPhaseDetails(currentPhase);
      
      this.showNotification('Period entry added successfully! Scroll down to see your personalized recommendations.', 'success');

      // Reset form
      document.getElementById('start-date').value = '';
      document.getElementById('end-date').value = '';
      document.getElementById('symptoms').value = '';
      this.selectedSymptoms.clear();
      document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
  }

  updatePredictions() {
      if (this.cycles.length < 1) {
          this.updatePredictionText('next-period', 'Need more data');
          this.updatePredictionText('cycle-length', 'Need more data');
          this.updatePredictionText('ovulation-date', 'Need more data');
          return;
      }

      // Calculate cycle length based on the most recent cycle
      let cycleLength = 28; // Default length
      if (this.cycles.length >= 2) {
          const lastCycle = this.cycles[this.cycles.length - 1];
          const previousCycle = this.cycles[this.cycles.length - 2];
          cycleLength = Math.round((lastCycle.startDate - previousCycle.startDate) / (1000 * 60 * 60 * 24));
      }

      // Predict next period based on the last period start date
      const lastPeriod = this.cycles[this.cycles.length - 1].startDate;
      const nextPeriod = new Date(lastPeriod);
      nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

      // Calculate ovulation (typically 14 days before the next period)
      const ovulationDate = new Date(nextPeriod);
      ovulationDate.setDate(ovulationDate.getDate() - 14);

      this.updatePredictionText('next-period', this.formatDate(nextPeriod));
      this.updatePredictionText('cycle-length', `${cycleLength} days`);
      this.updatePredictionText('ovulation-date', this.formatDate(ovulationDate));
  }

  updatePredictionText(elementId, text) {
      const element = document.getElementById(elementId);
      if (element) {
          element.textContent = text;
          element.classList.add('fade-in');
          setTimeout(() => element.classList.remove('fade-in'), 300);
      }
  }

  setupCalendar() {
      this.updateCalendarHeader();
      this.updateCalendar();
  }

  updateCalendarHeader() {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
      document.getElementById('current-month').textContent = 
          monthNames[this.displayDate.getMonth()] + ' ' + this.displayDate.getFullYear();
  }

  updateCalendar() {
      const calendar = document.getElementById('calendar');
      calendar.innerHTML = '';

      const firstDay = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), 1);
      const lastDay = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() + 1, 0);
      
      // Add empty cells for days before the first of the month
      for (let i = 0; i < firstDay.getDay(); i++) {
          calendar.appendChild(this.createCalendarDay(''));
      }

      // Add days of the month
      for (let date = 1; date <= lastDay.getDate(); date++) {
          const dayElement = this.createCalendarDay(date);
          const currentDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), date);
          
          // Mark period days
          if (this.isDateInPeriod(currentDate)) {
              dayElement.classList.add('period');
          }
          
          // Mark ovulation days
          if (this.isOvulationDay(currentDate)) {
              dayElement.classList.add('ovulation');
          }

          calendar.appendChild(dayElement);
      }
  }

  createCalendarDay(content) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = content;
      return day;
  }

  isDateInPeriod(date) {
      if (!this.cycles || this.cycles.length === 0) return false;
      
      // Only check the most recent cycle
      const lastCycle = this.cycles[this.cycles.length - 1];
      
      // Skip if no valid start date
      if (!lastCycle || !lastCycle.startDate) return false;
      
      const start = new Date(lastCycle.startDate);
      const end = lastCycle.endDate ? new Date(lastCycle.endDate) : new Date(start.getTime() + (5 * 24 * 60 * 60 * 1000));
      
      // Normalize all dates to compare only year, month, day
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      // Check if the date is between start and end (inclusive)
      return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  }

  isOvulationDay(date) {
      if (!this.cycles || this.cycles.length < 1) return false;
      
      // Get the most recent cycle
      const lastCycle = this.cycles[this.cycles.length - 1];
      if (!lastCycle.startDate) return false;
      
      const lastPeriod = new Date(lastCycle.startDate);
      
      // Calculate average cycle length if we have enough data
      let cycleLength = 28; // Default to 28 days
      
      if (this.cycles.length >= 2) {
          const cycleLengths = [];
          for (let i = 1; i < this.cycles.length; i++) {
              const days = Math.round((new Date(this.cycles[i].startDate) - new Date(this.cycles[i-1].startDate)) / (1000 * 60 * 60 * 1000 * 24));
              if (days > 0 && days < 60) { // Only consider reasonable cycle lengths
                  cycleLengths.push(days);
              }
          }
          
          if (cycleLengths.length > 0) {
              cycleLength = Math.round(cycleLengths.reduce((a, b) => a + b) / cycleLengths.length);
          }
      }
      
      // Calculate ovulation date (approximately 14 days before the next period)
      const ovulationDate = new Date(lastPeriod);
      ovulationDate.setDate(ovulationDate.getDate() + Math.round(cycleLength / 2) - 2); // Adjusted to be more accurate
      
      // Normalize dates for comparison
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizedOvulation = new Date(ovulationDate.getFullYear(), ovulationDate.getMonth(), ovulationDate.getDate());
      
      return normalizedDate.getTime() === normalizedOvulation.getTime();
  }

  formatListToHtml(text) {
      const lines = text.split('\n');
      return '<ul>' + 
          lines.map(line => `<li>${line.replace(/^• /, '')}</li>`).join('') + 
          '</ul>';
  }

  changeMonth(delta) {
      this.displayDate.setMonth(this.displayDate.getMonth() + delta);
      this.updateCalendarHeader();
      this.updateCalendar();
  }

  updateHistory() {
      const historyList = document.getElementById('history-list');
      historyList.innerHTML = '';

      this.cycles.slice().reverse().forEach(cycle => {
          const entry = document.createElement('div');
          entry.className = 'history-item fade-in';
          
          const dateRange = cycle.endDate ? 
              `${this.formatDate(cycle.startDate)} - ${this.formatDate(cycle.endDate)}` :
              this.formatDate(cycle.startDate);

          const symptoms = [...cycle.symptoms, ...cycle.customSymptoms].join(', ');
          
          entry.innerHTML = `
              <strong>${dateRange}</strong>
              ${symptoms ? `<br>Symptoms: ${symptoms}` : ''}
          `;
          
          historyList.appendChild(entry);
      });
  }

  showPhaseDetails(phase) {
      const phaseInfo = {
          menstrual: {
              title: 'Menstrual Phase (Days 1-5)',
              description: 'Welcome to your menstrual phase! This is when your period occurs, and your body is beginning a new cycle. Your hormone levels are at their lowest, which is completely normal.',
              feelings: 'You might be experiencing fatigue, cramps, or mood changes. Remember, these symptoms are temporary and your body is doing important work!',
              tips: '• Take warm baths to ease cramps\n• Practice gentle yoga or stretching\n• Get extra rest - it\'s okay to slow down!\n• Use a heating pad on your lower abdomen\n• Practice mindful breathing or meditation',
              nutrition: '• Increase iron-rich foods (leafy greens, lean meats)\n• Stay hydrated with water and herbal teas\n• Dark chocolate (70%+ cocoa) can help with cravings\n• Avoid excessive caffeine and alcohol\n• Include anti-inflammatory foods like berries and fish',
              lifestyle: '• Aim for 8-9 hours of sleep\n• Best sleep time: Try to be in bed by 10 PM\n• Light exercises like walking or swimming\n• Wear comfortable, loose clothing\n• Take breaks when needed - listen to your body'
          },
          follicular: {
              title: 'Follicular Phase (Days 6-14)',
              description: 'You\'re in your follicular phase! This is an exciting time when your energy starts to return and your body prepares for ovulation. Your estrogen levels are rising, bringing positive changes!',
              feelings: 'You might notice increased energy, better mood, and enhanced creativity. This is a great time to start new projects or tackle challenging tasks!',
              tips: '• Channel your rising energy into creative projects\n• Try new workout routines\n• Schedule important meetings or presentations\n• Connect with friends and socialize\n• Start that project you\'ve been thinking about',
              nutrition: '• Include protein-rich foods for energy\n• Fresh fruits and vegetables\n• Complex carbohydrates for sustained energy\n• Green smoothies for nutrients\n• Light, energizing meals',
              lifestyle: '• Best time for high-intensity workouts\n• Ideal sleep time: 7-8 hours\n• Plan social activities\n• Take advantage of your natural confidence\n• Great time for learning new skills'
          },
          ovulation: {
              title: 'Ovulation Phase (Days 14-16)',
              description: 'Welcome to your ovulation phase! This is when you\'re likely feeling your best. Your energy levels are high, and you might notice increased confidence and vitality.',
              feelings: 'You\'re likely feeling energetic, confident, and social. Many women experience their highest level of natural confidence during this phase!',
              tips: '• Make the most of your peak energy\n• Engage in social activities\n• Perfect time for important presentations\n• Express yourself creatively\n• Stay active and embrace your energy',
              nutrition: '• Focus on light, fresh foods\n• Include foods rich in antioxidants\n• Stay well hydrated\n• Include healthy fats like avocados and nuts\n• Eat regular, balanced meals',
              lifestyle: '• Excellent time for high-intensity exercise\n• Ideal for social gatherings\n• 7-8 hours of quality sleep\n• Great time for outdoor activities\n• Perfect for challenging workouts'
          },
          luteal: {
              title: 'Luteal Phase (Days 17-28)',
              description: 'You\'re in your luteal phase, the longest phase of your cycle. Your body is preparing either for pregnancy or menstruation. Be extra gentle with yourself during this time.',
              feelings: 'You might notice mood changes, food cravings, or slight fatigue. These are all normal responses to hormonal changes. Practice self-compassion!',
              tips: '• Practice stress-management techniques\n• Keep a mood journal\n• Take relaxing baths\n• Maintain a consistent routine\n• Listen to calming music or podcasts',
              nutrition: '• Increase magnesium-rich foods (nuts, seeds)\n• Complex carbs to manage cravings\n• Avoid excessive salt and sugar\n• Calming herbal teas like chamomile\n• Small, frequent meals to maintain energy',
              lifestyle: '• Moderate exercise like yoga or pilates\n• Aim for 8-9 hours of sleep\n• Best sleep time: Earlier nights (9:30-10 PM)\n• Reduce caffeine intake\n• Schedule quiet, relaxing activities'
          }
      };

      const info = phaseInfo[phase];
      document.getElementById('current-phase').textContent = info.title;
      document.getElementById('phase-description').textContent = info.description;
      document.getElementById('phase-feelings').textContent = info.feelings;
      document.getElementById('phase-tips').innerHTML = this.formatListToHtml(info.tips);
      document.getElementById('phase-nutrition').innerHTML = this.formatListToHtml(info.nutrition);
      document.getElementById('phase-lifestyle').innerHTML = this.formatListToHtml(info.lifestyle);
  }

  calculateCurrentPhase(startDate, endDate) {
      const today = new Date();
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      // Calculate days since period start
      const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      
      // Determine phase based on typical cycle lengths
      if (daysSinceStart <= 5) {
          return 'menstrual';
      } else if (daysSinceStart <= 14) {
          return 'follicular';
      } else if (daysSinceStart <= 16) {
          return 'ovulation';
      } else {
          return 'luteal';
      }
  }

  formatDate(date) {
      return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
      });
  }

  showNotification(message, type) {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type} fade-in`;
      notification.textContent = message;

      // Add to document
      document.body.appendChild(notification);

      // Remove after 3 seconds
      setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
      }, 3000);
  }

  saveCycles() {
      localStorage.setItem('cycleWiseData', JSON.stringify(this.cycles));
  }

  loadData() {
      const savedData = localStorage.getItem('cycleWiseData');
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              // Clear existing cycles
              this.cycles = [];
              // Properly convert dates for each cycle
              parsed.forEach(cycle => {
                  this.cycles.push({
                      startDate: cycle.startDate ? new Date(cycle.startDate) : null,
                      endDate: cycle.endDate ? new Date(cycle.endDate) : null,
                      symptoms: cycle.symptoms || [],
                      customSymptoms: cycle.customSymptoms || []
                  });
              });
          } catch (error) {
              console.error('Error parsing saved cycle data:', error);
              this.cycles = [];
          }
      }
  }

  updateUI() {
      this.updatePredictions();
      this.updateCalendar();
      this.updateHistory();
      this.showPhaseDetails('menstrual'); // Show initial phase info
  }

  setupResourcesSection() {
      // Setup filter buttons
      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              // Remove active class from all buttons
              filterBtns.forEach(b => b.classList.remove('active'));
              // Add active class to clicked button
              btn.classList.add('active');
              // Filter resources
              this.filterResources(btn.dataset.filter);
          });
      });

      // Setup resource links
      const resourceLinks = document.querySelectorAll('.resource-link');
      resourceLinks.forEach(link => {
          link.addEventListener('click', (e) => {
              e.preventDefault();
              this.showResourceContent(link.dataset.resource);
          });
      });

      // Setup modal close button
      const closeModal = document.querySelector('.close-modal');
      const modal = document.getElementById('resource-modal');
      closeModal.addEventListener('click', () => {
          modal.style.display = 'none';
      });

      // Close modal when clicking outside
      window.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.style.display = 'none';
          }
      });
  }

  filterResources(filter) {
      const resources = document.querySelectorAll('.resource-card');
      resources.forEach(resource => {
          if (filter === 'all' || resource.dataset.type === filter) {
              resource.style.display = 'block';
          } else {
              resource.style.display = 'none';
          }
      });
  }

  showResourceContent(resourceId) {
      const modal = document.getElementById('resource-modal');
      const contentDiv = document.getElementById('resource-content');
      
      const resources = {
          'cycle-guide': {
              title: 'Understanding Your Menstrual Cycle',
              content: `
                  <h6 style="text-align: left;">Your Complete Guide to the Menstrual Cycle</h6>
                  <p>Your menstrual cycle is a natural, healthy process that your body goes through each month. Understanding each phase can help you better manage your health and well-being.</p>
                  
                  <h6 style="text-align: left;">The Four Phases of Your Cycle</h6>
                  <ul>
                      <li><strong>Menstrual Phase (Days 1-5):</strong> This is when your period occurs. Your body is shedding the uterine lining that built up in preparation for pregnancy.</li>
                      <li><strong>Follicular Phase (Days 6-14):</strong> Your body prepares for ovulation. Estrogen levels rise, boosting your energy and mood.</li>
                      <li><strong>Ovulation Phase (Days 14-16):</strong> An egg is released from your ovary. This is when you're most fertile.</li>
                      <li><strong>Luteal Phase (Days 17-28):</strong> Your body prepares either for pregnancy or menstruation. You might experience PMS symptoms during this time.</li>
                  </ul>

                  <h6 style="text-align: left;">Tracking Your Cycle</h6>
                  <p>Every person's cycle is unique, and that's completely normal! While the average cycle is 28 days, anything from 21-35 days is considered normal. The key is understanding your personal pattern.</p>

                  <h6 style="text-align: left;">Signs to Watch For</h6>
                  <ul>
                      <li>Changes in energy levels</li>
                      <li>Mood fluctuations</li>
                      <li>Physical symptoms (cramps, breast tenderness)</li>
                      <li>Changes in cervical mucus</li>
                      <li>Body temperature variations</li>
                  </ul>
              `
          },
          'nutrition': {
              title: 'Nutrition and Your Cycle',
              content: `
                  <h6 style="text-align: left;">Eating for Your Cycle</h6>
                  <p>Your nutritional needs change throughout your cycle. Here's how to nourish your body during each phase:</p>

                  <h6 style="text-align: left;">Menstrual Phase</h6>
                  <ul>
                      <li>Iron-rich foods (leafy greens, red meat)</li>
                      <li>Foods high in vitamin C (citrus fruits, berries)</li>
                      <li>Warm, comforting foods</li>
                      <li>Stay hydrated with water and herbal teas</li>
                  </ul>

                  <h6 style="text-align: left;">Follicular Phase</h6>
                  <ul>
                      <li>Light, fresh foods</li>
                      <li>Fermented foods for gut health</li>
                      <li>Foods rich in vitamin E</li>
                      <li>Fresh fruits and vegetables</li>
                  </ul>

                  <h6 style="text-align: left;">Ovulation Phase</h6>
                  <ul>
                      <li>Raw fruits and vegetables</li>
                      <li>Lean proteins</li>
                      <li>Foods rich in zinc and magnesium</li>
                      <li>Stay well hydrated</li>
                  </ul>

                  <h6 style="text-align: left;">Luteal Phase</h6>
                  <ul>
                      <li>Complex carbohydrates</li>
                      <li>Magnesium-rich foods (nuts, seeds)</li>
                      <li>Foods high in B vitamins</li>
                      <li>Calcium-rich foods</li>
                  </ul>
              `
          },
          'exercise': {
              title: 'Exercise and Your Cycle',
              content: `
                  <h6 style="text-align: left;">Cycle-Synced Workouts</h6>
                  <div class="video-container">
                      <iframe src="https://www.youtube.com/embed/PBd2CZC-JIE" frameborder="0" allowfullscreen></iframe>
                  </div>
                  <p>Learn how to adjust your workout routine according to your cycle phases:</p>
                  
                  <h6 style="text-align: left;">Recommended Activities by Phase</h6>
                  <ul>
                      <li><strong>Menstrual Phase:</strong> Gentle yoga, walking, light stretching</li>
                      <li><strong>Follicular Phase:</strong> High-intensity workouts, strength training</li>
                      <li><strong>Ovulation Phase:</strong> Dance, cardio, group sports</li>
                      <li><strong>Luteal Phase:</strong> Moderate cardio, pilates, swimming</li>
                  </ul>
              `
          },
          'stress': {
              title: 'Stress Management Techniques',
              content: `
                  <h6 style="text-align: left;">Managing Stress Throughout Your Cycle</h6>
                  <div class="video-container">
                      <iframe src="https://www.youtube.com/embed/M0quxzUtqEg" frameborder="0" allowfullscreen></iframe>
                  </div>
                  <p>Different stress management techniques work better during different phases of your cycle. Here's your guide:</p>

                  <h6 style="text-align: left;">Phase-Specific Techniques</h6>
                  <ul>
                      <li><strong>Menstrual Phase:</strong> Meditation, gentle breathing exercises</li>
                      <li><strong>Follicular Phase:</strong> Journaling, creative activities</li>
                      <li><strong>Ovulation Phase:</strong> Social connection, outdoor activities</li>
                      <li><strong>Luteal Phase:</strong> Progressive muscle relaxation, aromatherapy</li>
                  </ul>
              `
          },
          'pms': {
              title: 'PMS Management Guide',
              content: `
                  <h6 style="text-align: left;">Natural PMS Management Strategies</h6>
                  <p>PMS affects everyone differently. Here are evidence-based strategies to help manage common symptoms:</p>

                  <h6 style="text-align: left;">Physical Symptoms</h6>
                  <ul>
                      <li>Regular exercise</li>
                      <li>Adequate sleep (7-9 hours)</li>
                      <li>Heat therapy for cramps</li>
                      <li>Dietary adjustments</li>
                  </ul>

                  <h6 style="text-align: left;">Emotional Symptoms</h6>
                  <ul>
                      <li>Stress management techniques</li>
                      <li>Support group participation</li>
                      <li>Mindfulness practices</li>
                      <li>Regular self-care routines</li>
                  </ul>

                  <h6 style="text-align: left;">Lifestyle Changes</h6>
                  <ul>
                      <li>Reducing caffeine and alcohol</li>
                      <li>Maintaining a regular sleep schedule</li>
                      <li>Planning ahead for symptom management</li>
                      <li>Creating a supportive environment</li>
                  </ul>
              `
          },
          'faq': {
              title: 'Menstrual Health FAQ',
              content: `
                  <h6 style="text-align: left;">Frequently Asked Questions</h6>
                  
                  <h6 style="text-align: left;">What's considered a normal cycle length?</h6>
                  <p>A normal cycle can range from 21-35 days. The average is 28 days, but everyone is different!</p>

                  <h6 style="text-align: left;">When should I see a healthcare provider?</h6>
                  <p>Consult a healthcare provider if you experience:</p>
                  <ul>
                      <li>Very heavy bleeding</li>
                      <li>Severe pain that interferes with daily activities</li>
                      <li>Irregular cycles</li>
                      <li>Bleeding between periods</li>
                  </ul>

                  <h6 style="text-align: left;">How can I track my cycle effectively?</h6>
                  <p>Use our tracker to log:</p>
                  <ul>
                      <li>Period start and end dates</li>
                      <li>Physical and emotional symptoms</li>
                      <li>Energy levels</li>
                      <li>Sleep patterns</li>
                  </ul>

                  <h6 style="text-align: left;">Can lifestyle changes affect my cycle?</h6>
                  <p>Yes! The following factors can impact your cycle:</p>
                  <ul>
                      <li>Stress levels</li>
                      <li>Diet and exercise</li>
                      <li>Sleep quality</li>
                      <li>Major life changes</li>
                  </ul>
              `
          }
      };

      const resource = resources[resourceId];
      if (resource) {
          contentDiv.innerHTML = resource.content;
          modal.style.display = 'block';
      }
  }

  setupAnimations() {
      // Add animation classes to sections
      const sections = document.querySelectorAll('section');
      sections.forEach((section, index) => {
          if (index % 2 === 0) {
              section.classList.add('animate', 'slide-in-left');
          } else {
              section.classList.add('animate', 'slide-in-right');
          }
      });

      // Add animation classes to prediction cards
      document.querySelectorAll('.prediction-card').forEach((card, index) => {
          card.classList.add('animate', 'fade-in-up', `delay-${index + 1}`);
      });

      // Add animation classes to phase boxes
      document.querySelectorAll('.phase-box').forEach((box, index) => {
          box.classList.add('animate', 'fade-in-up', `delay-${index + 1}`);
      });

      // Add animation classes to resource cards
      document.querySelectorAll('.resource-card').forEach((card, index) => {
          card.classList.add('animate', 'fade-in-up', `delay-${index % 3 + 1}`);
      });

      // Setup Intersection Observer
      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
                  // If the element has animation classes, trigger them
                  if (entry.target.classList.contains('animate')) {
                      entry.target.style.animationPlayState = 'running';
                  }
                  // Unobserve after animation is triggered
                  observer.unobserve(entry.target);
              }
          });
      }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
      });

      // Observe all animated elements
      document.querySelectorAll('.animate, section').forEach(element => {
          observer.observe(element);
          // Initially pause all animations
          if (element.classList.contains('animate')) {
              element.style.animationPlayState = 'paused';
          }
      });
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new CycleWise();
});
