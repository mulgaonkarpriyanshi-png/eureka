(function () {
  'use strict';

  var root = document.getElementById('eq-wrap');
  if (!root) return;

  var CONFIG = {
    webhookUrl: root.getAttribute('data-webhook-url') || '',
    whatsappNumber: '919792496457',
    localStorageKey: 'eurekaCustomTripEnquiries'
  };

  var birthday = { text: 'Birthday trip', value: 1, intent: 1 };
  var repeatTrip = { text: "Last year's trip anniversary", sub: "Same dates as last year's trip, a new adventure", value: 1, intent: 1 };
  var somethingElse = { text: 'Something else', sub: 'Your own kind of occasion. Tell us in the message', value: 1, intent: 1 };
  var noEvent = { text: 'No special plans', value: 0, intent: 0 };
  var events = {
    'Just me': [birthday, repeatTrip, somethingElse, noEvent],
    Family: [{ text: 'Anniversary', value: 2, intent: 1 }, birthday, repeatTrip, somethingElse, noEvent],
    'Group of friends': [birthday, { text: 'Bachelor/Bachelorette', value: 2, intent: 1 }, repeatTrip, somethingElse, noEvent],
    Couple: [{ text: 'Honeymoon', value: 2, intent: 1 }, { text: 'Anniversary', value: 2, intent: 1 }, birthday, { text: 'Getaway', value: 0, intent: 0 }, repeatTrip, somethingElse]
  };

  var answers = {};
  var index = 0;
  var leadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  var steps = [
    { key: 'trip', question: 'What kind of trip are you looking for?', options: [
      { text: 'Slow travel', sub: '7-12 days', value: 4, intent: 0 },
      { text: 'Adventure trip', sub: 'Comfortable stays + adventure', value: 3, intent: 0 },
      { text: 'Short trip', sub: 'Weekend getaways or long weekends', value: 2, intent: 0 },
      { text: 'Easy on the pocket', sub: 'A refreshing change of scene', value: 0, intent: 0 }
    ]},
    { key: 'when', question: 'When are you looking to travel?', options: [
      { text: 'Upcoming long weekend', value: 0, intent: 3 },
      { text: 'Within 30 days', value: 0, intent: 4 },
      { text: '30-90 days, or I have specific dates', value: 0, intent: 4 },
      { text: 'Flexible, no fixed dates', value: 0, intent: 1 },
      { text: 'Just exploring', value: 0, intent: 0 }
    ]},
    { key: 'who', question: "Who's tagging along?", twoColumns: true, options: [
      { text: 'Just me', value: 1, intent: 0 },
      { text: 'Couple', value: 2, intent: 0 },
      { text: 'Family', value: 3, intent: 0 },
      { text: 'Group of friends', value: 3, intent: 0 }
    ]},
    { key: 'event', question: 'Any special plans?', sub: "Celebrating something? We'll plan around it.", twoColumns: true, options: function () { return events[answers.who] || [noEvent, somethingElse]; } },
    { key: 'scope', question: 'Where are we headed?', sub: "Pick the kind of trip you're after.", options: [
      { text: 'Passport stamp, please', sub: 'International trip', value: 2, intent: 0 },
      { text: 'Aadhaar card is enough', sub: 'Domestic trip within India', value: 0, intent: 0 }
    ]},
    { key: 'place', textInput: true,
      question: function () { return answers.scope && answers.scope.indexOf('Passport') === 0 ? 'Any country, region or vibe in mind?' : 'Any region, mood or place in mind?'; },
      sub: 'Optional. Skip it if you would like us to suggest.',
      placeholder: function () { return answers.scope && answers.scope.indexOf('Passport') === 0 ? 'Bali, Europe, beaches, snow...' : 'Himalayas, Goa, something peaceful...'; }
    },
    { key: 'contact', question: "What's the best way to reach you?", twoColumns: true, options: [
      { text: 'WhatsApp me', value: 0, intent: 1 },
      { text: 'Schedule a call', sub: 'Tell us when to call', value: 0, intent: 3 }
    ]},
    { key: 'call_time_preference', textInput: true, required: true, only: function () { return answers.contact === 'Schedule a call'; },
      question: 'When should we call you?', sub: "We'll confirm on WhatsApp and remind you before the call.", placeholder: 'e.g. Tomorrow after 6 PM' },
    { key: 'details', question: 'Last step: where do we send your plan?', sub: "We'll only use this to plan your trip." }
  ];

  function byId(id) { return document.getElementById(id); }
  var body = byId('eq-body');
  var nextButton = byId('eq-next');
  var backButton = byId('eq-back');

  function optionList(step) { return typeof step.options === 'function' ? step.options() : step.options; }
  function score() {
    var value = 0;
    var intent = 0;
    steps.forEach(function (step) {
      var selected = answers[step.key];
      var options = optionList(step);
      if (!selected || !options) return;
      var match = options.filter(function (option) { return option.text === selected; })[0];
      if (match) {
        value += match.value || 0;
        intent += match.intent || 0;
      }
    });
    var tier = intent >= 7 && value >= 7 ? 'HOT' : value >= 7 ? 'WARM - HIGH VALUE' : intent >= 7 ? 'HOT - LOW VALUE' : 'COLD';
    return { value: value, intent: intent, tier: tier };
  }

  function trackingData() {
    var params = new URLSearchParams(window.location.search);
    var data = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(function (key) {
      if (params.get(key)) data[key] = params.get(key);
    });
    return data;
  }

  function payload(partial) {
    var result = score();
    var details = byId('eq-name') ? {
      name: byId('eq-name').value.trim(),
      phone: byId('eq-phone').value.trim(),
      email: byId('eq-email').value.trim(),
      message: byId('eq-msg').value.trim()
    } : {};
    return Object.assign({
      lead_id: leadId,
      partial: Boolean(partial),
      submitted_at: new Date().toISOString(),
      page: window.location.href.split('?')[0],
      referrer: document.referrer,
      trip_type: answers.trip || '',
      travel_window: answers.when || '',
      travelling_with: answers.who || '',
      occasion: answers.event || '',
      trip_scope: answers.scope || '',
      destination_note: answers.place || '',
      call_time_preference: answers.call_time_preference || '',
      contact_preference: answers.contact || '',
      intent_score: result.intent,
      value_score: result.value,
      lead_tier: result.tier
    }, trackingData(), details);
  }

  function saveRecoveryCopy(data) {
    try {
      var saved = JSON.parse(localStorage.getItem(CONFIG.localStorageKey) || '[]');
      saved.push(data);
      localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(saved.slice(-50)));
    } catch (error) {}
  }

  function send(data) {
    saveRecoveryCopy(data);
    if (!CONFIG.webhookUrl) {
      console.warn('Eureka enquiry webhook is not configured.', data);
      return Promise.resolve({ storedRemotely: false });
    }
    return fetch(CONFIG.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).then(function () { return { storedRemotely: true }; });
  }

  function move(direction) {
    index += direction;
    while (steps[index] && steps[index].only && !steps[index].only()) index += direction;
    render();
  }

  function render() {
    var step = steps[index];
    byId('eq-fill').style.width = Math.round(index / steps.length * 100) + '%';
    byId('eq-q').textContent = typeof step.question === 'function' ? step.question() : step.question;
    byId('eq-sub').textContent = step.sub || '';
    byId('eq-sub').hidden = !step.sub;
    body.innerHTML = '';
    backButton.style.visibility = index ? 'visible' : 'hidden';
    var options = optionList(step);

    if (options) {
      var wrapper = document.createElement('div');
      wrapper.className = 'eq-opts' + (step.twoColumns ? ' two' : '');
      options.forEach(function (option) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'eq-opt' + (answers[step.key] === option.text ? ' sel' : '');
        button.innerHTML = '<span>' + option.text + '</span>' + (option.sub ? '<small>' + option.sub + '</small>' : '');
        button.addEventListener('click', function () {
          if (step.key === 'who' && answers.who !== option.text) delete answers.event;
          answers[step.key] = option.text;
          button.classList.add('sel');
          window.setTimeout(function () { move(1); }, 160);
        });
        wrapper.appendChild(button);
      });
      body.appendChild(wrapper);
      nextButton.classList.add('eq-hide');
      return;
    }

    if (step.textInput) {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'eq-txt';
      input.maxLength = 120;
      input.setAttribute('aria-label', byId('eq-q').textContent);
      input.placeholder = typeof step.placeholder === 'function' ? step.placeholder() : step.placeholder;
      input.value = answers[step.key] || '';
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); nextButton.click(); }
      });
      body.appendChild(input);
      nextButton.textContent = 'Next';
      nextButton.classList.remove('eq-hide');
      input.focus();
      return;
    }

    body.innerHTML =
      '<label class="eq-f" id="f-name">Name*<input id="eq-name" autocomplete="name" required><span class="eq-err">Please enter your name.</span></label>' +
      '<label class="eq-f" id="f-phone">Phone / WhatsApp number*<input id="eq-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91 98765 43210" required><span class="eq-err">Please enter a valid phone number.</span></label>' +
      '<label class="eq-f" id="f-email">Email*<input id="eq-email" type="email" autocomplete="email" required><span class="eq-err">Please enter a valid email.</span></label>' +
      '<label class="eq-f">Anything you would like to tell us? (optional)<textarea id="eq-msg" placeholder="Places saved, dates, must-do experiences or questions..."></textarea></label>';
    nextButton.textContent = 'Send my details';
    nextButton.classList.remove('eq-hide');
    byId('eq-name').focus();
  }

  function validPhone(value) {
    var digits = value.replace(/[^\d]/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }
  function validEmail(value) { return /^\S+@\S+\.\S+$/.test(value); }
  function markInvalid(id, invalid) {
    byId(id).classList.toggle('bad', invalid);
    return invalid;
  }

  nextButton.addEventListener('click', function () {
    var step = steps[index];
    if (step.textInput) {
      var value = byId('eq-txt').value.trim();
      if (step.required && value.length < 3) {
        byId('eq-sub').textContent = 'Please tell us when suits you, even roughly.';
        byId('eq-sub').hidden = false;
        byId('eq-txt').focus();
        return;
      }
      answers[step.key] = value;
      move(1);
      return;
    }

    var invalid = false;
    invalid = markInvalid('f-name', !byId('eq-name').value.trim()) || invalid;
    invalid = markInvalid('f-phone', !validPhone(byId('eq-phone').value)) || invalid;
    invalid = markInvalid('f-email', !validEmail(byId('eq-email').value.trim())) || invalid;
    if (invalid) return;

    nextButton.disabled = true;
    nextButton.textContent = 'Sending...';
    var data = payload(false);
    send(data).catch(function () { return { storedRemotely: false }; }).then(function () { finish(data); });
  });

  backButton.addEventListener('click', function () { if (index) move(-1); });

  function finish(data) {
    byId('eq-form').classList.add('eq-hide');
    byId('eq-bar').classList.add('eq-hide');
    byId('eq-done').classList.remove('eq-hide');
    var firstName = data.name.split(' ')[0];
    var whatsapp = byId('eq-wa');
    if (answers.contact === 'Schedule a call') {
      byId('eq-done-h').textContent = 'Call request received';
      byId('eq-done-msg').textContent = firstName + ", we'll call you on " + data.phone + '. We will confirm the exact time on WhatsApp.';
    } else {
      byId('eq-done-msg').textContent = firstName + ", we'll message you on WhatsApp soon. You can also start the chat now.";
      var text = "Hi Eureka Trips! I'm " + data.name + ". I'm looking for " + (answers.trip || 'a custom trip').toLowerCase() + (answers.destination_note ? ' to ' + answers.destination_note : '') + '.';
      whatsapp.href = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(text);
      whatsapp.classList.remove('eq-hide');
    }
    if (window.fbq) {
      try { window.fbq('track', 'Lead', { content_category: data.lead_tier }); } catch (error) {}
    }
  }

  render();
})();
