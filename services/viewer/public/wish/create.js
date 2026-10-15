// iNiXR AR Wish — creator page (Pooja, Birthday, Thank-you, Love, Awards).
// The wish is packed into the link's #fragment, so the message never reaches our server.
// Only the two short first names also go in the query (?f=&t=), so WhatsApp's preview can say
// "Nithy sent you a Pooja gift, Gokul!". The server never stores them and strips them from its logs.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var EVT_URL = document.body.dataset.evt;
  var VIEW_URL = { bday: document.body.dataset.view, ty: document.body.dataset.thanks, rx: document.body.dataset.react, aw: document.body.dataset.award, pj: document.body.dataset.pooja };

  var KINDS = {
    pj: {
      emoji: '🪔',
      title: 'Send a 3D Pooja gift',
      sub: 'A Pooja altar in their room — lamp, flowers, pori-kadalai and their work blessed with sandal & kumkum 🙏',
      toLabel: 'Who is it for? (a name, or your group)',
      msgLabel: 'Your Pooja wish',
      waText: function (to, url, from) {
        var greet = pjMode.key === 'sar' ? '📚 சரஸ்வதி பூஜை வாழ்த்துக்கள்! ' : '🪔 ஆயுத பூஜை வாழ்த்துக்கள்! ';
        return greet + to + ', ' + (from || 'someone') + ' sent you a Pooja gift 🙏 Tap to light the lamp 👉 ' + url;
      },
      chips: [],
    },
    bday: {
      emoji: '🎂',
      title: 'Send a 3D birthday wish',
      sub: 'Their name on a cake, a birthday song, and candles they blow out for real!',
      toLabel: 'Birthday person’s name',
      msgLabel: 'Your wish',
      waText: function (to, url) { return '🎂 ' + to + ', I sent you a birthday surprise! Tap to open 👉 ' + url; },
      chips: [
        ['English', 'Happy Birthday! 🎂 Wishing you a year full of joy, love and success!'],
        ['Fun', 'Happy Birthday my friend! Stay awesome, stay crazy 😄🎉'],
        ['தமிழ்', 'இனிய பிறந்தநாள் நல்வாழ்த்துக்கள்! 🎂 உங்கள் வாழ்வில் எல்லா மகிழ்ச்சியும் நிறையட்டும்!'],
        ['தமிழ் 2', 'பிறந்தநாள் வாழ்த்துக்கள்! 🎉 நீங்கள் நினைத்தது எல்லாம் நடக்கட்டும்!'],
        ['Tanglish', 'Happy Birthday da! 🎂 Innum neraya vayasu aagattum… treat eppo? 😄'],
      ],
    },
    rx: {
      emoji: '💞',
      title: 'Send love, friendship & more',
      sub: 'A big 3D emoji pops up in their room — love, hugs, best friends, miss you!',
      toLabel: 'Send it to',
      msgLabel: 'Add a note (optional)',
      waText: function (to, url, from) { return react.emoji + ' ' + to + ', ' + (from || 'someone') + ' ' + react.verb + '! Tap to see it in 3D 👉 ' + url; },
      chips: [],
    },
    aw: {
      emoji: '🏆',
      title: 'Give your friend an award',
      sub: 'Drumroll… a gold trophy with a funny prop and their name. Friendly war zone! 😂',
      toLabel: 'Who wins the award?',
      msgLabel: 'Your award speech 😂',
      waText: function (to, url) {
        return '🏆 BREAKING NEWS 😂 ' + to + ' has won the ' + awardTitle() + ' AWARD! Watch the ceremony 👉 ' + url;
      },
      chips: [],
    },
    ty: {
      emoji: '💖',
      title: 'Send a 3D thank-you',
      sub: 'A gift box they open — a glowing heart and “THANK YOU” rise out of it!',
      toLabel: 'Who do you want to thank?',
      msgLabel: 'Your thank-you message',
      waText: function (to, url) {
        return item.label
          ? item.emoji + ' ' + to + ', thank you for ' + item.label + '! I made you a little surprise 👉 ' + url
          : '💖 ' + to + ', I sent you a special thank-you! Tap to open 👉 ' + url;
      },
      chips: [
        ['For wishes', 'Thank you so much for the lovely wishes! 💖 You made my day special.'],
        ['Best friend', 'Thank you for being my best friend all these years 🤝💖'],
        ['Warm', 'Thank you for always being there for me. You’re amazing! 💖'],
        ['தமிழ்', 'உங்கள் அன்பான வாழ்த்துக்கு மிக்க நன்றி! 💖'],
        ['தமிழ் 2', 'என் நாளை சிறப்பாக்கியதற்கு மனமார்ந்த நன்றி! 🙏😊'],
        ['Tanglish', 'Romba thanks da! 💖 Un wish thaan best 😄'],
      ],
    },
  };

  // "Thank you for…" treats (must match ITEM_INFO in wish.js) with ready messages per treat.
  var ITEMS = [
    { key: 'heart', chip: '💖 Everything', label: '', emoji: '💖' },
    { key: 'meals', chip: '🍛 Home food', label: 'the delicious food', emoji: '🍛', msgs: [
      ['English', 'Thank you for the delicious food! 🍛 Your cooking is the best in the world!'],
      ['Tanglish', 'Saapadu semma taste! 🍛 Romba thanks ma! 😋'],
      ['தமிழ்', 'சுவையான சாப்பாட்டுக்கு மிக்க நன்றி! 🍛❤️'],
    ] },
    { key: 'biryani', chip: '🍚 Biryani', label: 'the biryani', emoji: '😋', msgs: [
      ['English', 'That biryani was out of this world! 😋 Thank you so much!'],
      ['Tanglish', 'Biryani vera level! 😋 Romba thanks!'],
      ['தமிழ்', 'அருமையான பிரியாணிக்கு மிக்க நன்றி! 😋'],
    ] },
    { key: 'dosa', chip: '😋 Dosa', label: 'the crispy dosa', emoji: '😋', msgs: [
      ['English', 'Thanks for the crispy dosa! 😋 Perfect start to my day!'],
      ['Tanglish', 'Dosa semma crispy! 😋 Thanks ma!'],
      ['தமிழ்', 'சுடச்சுட தோசைக்கு மிக்க நன்றி! 😋'],
    ] },
    { key: 'chicken', chip: '🍗 Chicken', label: 'the chicken treat', emoji: '🍗', msgs: [
      ['English', 'That chicken treat was awesome! 🍗 Thank you so much!'],
      ['Tanglish', 'Chicken treat semma da! 🍗 Romba thanks!'],
      ['தமிழ்', 'சிக்கன் விருந்துக்கு மிக்க நன்றி! 🍗'],
    ] },
    { key: 'juice', chip: '🧃 Juice', label: 'the juice', emoji: '🧃', msgs: [
      ['English', 'Thanks for the juice! 🧃 So refreshing, just like you 😄'],
      ['Tanglish', 'Juice ku romba thanks da! 🧃 Semma refreshing!'],
      ['தமிழ்', 'ஜூஸுக்கு மிக்க நன்றி! 🧃'],
    ] },
    { key: 'icecream', chip: '🍦 Ice cream', label: 'the ice cream', emoji: '🍦', msgs: [
      ['English', 'Thank you for the ice cream! 🍦 Sweetest treat ever!'],
      ['Tanglish', 'Ice cream ku thanks da! 🍦 Next time en treat!'],
      ['தமிழ்', 'ஐஸ்கிரீமுக்கு மிக்க நன்றி! 🍦'],
    ] },
    { key: 'coffee', chip: '☕ Coffee / Tea', label: 'the coffee', emoji: '☕', msgs: [
      ['English', 'Thanks for the coffee and the chat! ☕ Made my day.'],
      ['Tanglish', 'Coffee ku thanks da! ☕ Next round en treat!'],
      ['தமிழ்', 'காபிக்கு மிக்க நன்றி! ☕'],
    ] },
    { key: 'pizza', chip: '🍕 Pizza', label: 'the pizza', emoji: '🍕', msgs: [
      ['English', 'Thank you for the pizza! 🍕 You are a slice of awesome!'],
      ['Tanglish', 'Pizza treat ku thanks da! 🍕'],
      ['தமிழ்', 'பீட்சாவுக்கு மிக்க நன்றி! 🍕'],
    ] },
    { key: 'chocolate', chip: '🍫 Chocolate', label: 'the chocolate', emoji: '🍫', msgs: [
      ['English', 'Thank you for the chocolate! 🍫 Sweet like you!'],
      ['Tanglish', 'Chocolate ku thanks da! 🍫'],
      ['தமிழ்', 'சாக்லேட்டுக்கு மிக்க நன்றி! 🍫'],
    ] },
  ];
  var RELS = [
    ['friend', 'Friend'], ['bestie', 'Bestie'], ['love', 'Love ❤️'], ['husband', 'Husband'], ['wife', 'Wife'],
    ['brother', 'Brother'], ['sister', 'Sister'], ['amma', 'Amma'], ['appa', 'Appa'], ['teacher', 'Teacher'],
    ['colleague', 'Colleague'], ['kind', 'Someone kind ✨'], ['bff', 'Best friend 🤝'], ['gang', 'The gang 🥳'], ['machan', 'Machan 😎'],
  ];
  // Reactions (must match REACTS in wish.js).
  var REACTS = [
    { key: 'love', chip: '❤️ Love', emoji: '❤️', verb: 'sent you love', msgs: [
      ['English', 'Love you so much ❤️'], ['Tanglish', 'Love you di/da ❤️ Always!'], ['தமிழ்', 'உன்னை ரொம்ப பிடிக்கும் ❤️'],
    ] },
    { key: 'hug', chip: '🤗 Hug', emoji: '🤗', verb: 'sent you a big hug', msgs: [
      ['English', 'Sending you the biggest, warmest hug 🤗'], ['Tanglish', 'Oru periya hug 🤗 Take care!'], ['தமிழ்', 'உனக்கு ஒரு பெரிய அணைப்பு 🤗'],
    ] },
    { key: 'kiss', chip: '😘 Kiss', emoji: '😘', verb: 'sent you a kiss', msgs: [
      ['English', 'Muah! 😘 Missing you already'], ['Tanglish', 'Muah! 😘 Seekiram vaa!'],
    ] },
    { key: 'haha', chip: '😂 Haha', emoji: '😂', verb: 'is laughing', msgs: [
      ['English', 'Hahaha you made my day 😂'], ['Tanglish', 'Semma comedy da 😂'],
    ] },
    { key: 'wow', chip: '😍 Wow', emoji: '😍', verb: 'loved it', msgs: [
      ['English', 'Wow! You are amazing 😍'], ['Tanglish', 'Vera level 😍'],
    ] },
    { key: 'aww', chip: '☺️ Aww', emoji: '☺️', verb: 'is blushing', msgs: [
      ['English', 'Aww, you are the sweetest ☺️'], ['Tanglish', 'Aww, romba sweet ☺️'],
    ] },
    { key: 'bff', chip: '🤝 Best friends', emoji: '🤝', verb: 'says you are the best friend ever', msgs: [
      ['English', 'Years of friendship and still my favourite person 🤝💖'],
      ['Tanglish', 'Nanba, nee illama naan illa 🤝'],
      ['Fun', 'Best friend = free therapist + partner in crime 😎🤝'],
      ['தமிழ்', 'என் உயிர் நண்பனுக்கு 🤝❤️'],
    ] },
    { key: 'gang', chip: '🥳 Best gang', emoji: '🥳', verb: 'says our gang is the best', msgs: [
      ['English', 'Our gang is the best gang. No debate 🥳'],
      ['Tanglish', 'Machans forever! Next trip eppo? 🥳'],
      ['Fun', 'Group chat: 500 messages. Plans made: 0 😂🥳'],
    ] },
    { key: 'missyou', chip: '🥺 Miss you', emoji: '🥺', verb: 'misses you', msgs: [
      ['English', 'Miss you so much 🥺 Let’s meet soon!'],
      ['Tanglish', 'Miss you machan 🥺 Seekiram meet pannalam!'],
      ['தமிழ்', 'உன்னை ரொம்ப மிஸ் பண்றேன் 🥺'],
    ] },
  ];
  // 🏆 Fun awards (must match AWARDS in wish.js).
  var AWARDS = [
    { key: 'liar', chip: '🤥 Great Liar', emoji: '🤥', title: 'GREAT LIAR', msgs: [
      ['English', 'Congratulations on lying for 365 days straight 😂🏆'], ['Tanglish', 'Poi solradhula nee thaan champion da 😂'] ] },
    { key: 'drinker', chip: '🍺 Great Drinker', emoji: '🍺', title: 'GREAT DRINKER', msgs: [
      ['English', 'Cheers to the undefeated champion 🍺😂'], ['Tanglish', 'Machan, bar-ku nee thaan brand ambassador 🍺😂'] ] },
    { key: 'puresoul', chip: '🧸 Pure Soul (non-drinker)', emoji: '🧸', title: 'PURE SOUL', msgs: [
      ['English', 'The only sober one who drops everyone home 🧸💖'], ['Tanglish', 'Juice mattum kudikkira pure soul nee thaan 🧸😂'] ] },
    { key: 'tallest', chip: '👠 Tallest Person (for the short one)', emoji: '👠', title: 'TALLEST PERSON', msgs: [
      ['English', 'Finally, heels to help you reach the top shelf 👠😂'], ['Tanglish', 'Ini mel unakku stool thevai illa 👠😂'] ] },
    { key: 'bigbrain', chip: '🧠 Big Brain', emoji: '🧠', title: 'BIG BRAIN', msgs: [
      ['English', 'For your brilliant ideas… that never work 🧠😂'], ['Tanglish', 'Moolai irukka nu doubt-a irundhuchu, adhan idhu 🧠😂'] ] },
    { key: 'sleepy', chip: '😴 Sleeping Champion', emoji: '😴', title: 'SLEEPING CHAMPION', msgs: [
      ['English', 'Can sleep anywhere, anytime. Legend 😴🏆'], ['Tanglish', 'Thookathula nee thaan world champion 😴😂'] ] },
    { key: 'late', chip: '⏰ Late Comer', emoji: '⏰', title: 'LATE COMER', msgs: [
      ['English', 'Always “5 mins away” for 2 hours ⏰😂'], ['Tanglish', '“Vandhuten da” nu solli 1 hour late ⏰😂'] ] },
    { key: 'foodie', chip: '🍗 Food Monster', emoji: '🍗', title: 'FOOD MONSTER', msgs: [
      ['English', 'No plate is safe around you 🍗😂'], ['Tanglish', 'Saapadu na mattum first-u vandhuduva 🍗😂'] ] },
    { key: 'phone', chip: '📱 Phone Addict', emoji: '📱', title: 'PHONE ADDICT', msgs: [
      ['English', 'Your phone deserves this award more than you 📱😂'], ['Tanglish', 'Phone illama oru nimisham kooda iruka mudiyadhu 📱😂'] ] },
    { key: 'drama', chip: '👑 Drama Star', emoji: '👑', title: 'DRAMA STAR', msgs: [
      ['English', 'Oscar-level drama every single day 👑😂'], ['Tanglish', 'Drama-la nee thaan superstar 👑😂'] ] },
    { key: 'bestie', chip: '🤝 Best Friend', emoji: '🤝', title: 'BEST FRIEND', msgs: [
      ['English', 'Years of friendship and still my favourite person 🤝💖'], ['Tanglish', 'Nanba, nee illama naan illa 🤝'], ['தமிழ்', 'என் உயிர் நண்பனுக்கு இந்த விருது 🤝'] ] },
    { key: 'custom', chip: '✍️ Your own title', emoji: '🏆', title: '', msgs: [
      ['English', 'You totally deserve this 😂🏆'], ['Tanglish', 'Indha award unakku thaan da 😂🏆'] ] },
  ];
  // 🪔 Pooja (must match POOJA_MODES and WORKS in wish.js).
  var POOJA_MODES = [
    { key: 'ay', chip: '🔧 Ayudha Pooja' },
    { key: 'sar', chip: '📚 Saraswathi Pooja', msgs: [
      ['English', 'Happy Saraswathi Pooja! 📚 May Goddess Saraswathi bless you with wisdom and success 🙏'],
      ['தமிழ்', 'சரஸ்வதி பூஜை நல்வாழ்த்துக்கள்! 📚 கல்வியும் ஞானமும் பெருகட்டும் 🙏'],
      ['Tanglish', 'Saraswathi Pooja wishes! 📚 Books, laptop ellam pooja-la vachaachu 😄🙏'],
      ['Both', 'ஆயுத பூஜை & சரஸ்வதி பூஜை நல்வாழ்த்துக்கள்! 🪔🙏 Happy Ayudha & Saraswathi Pooja!'],
    ] },
  ];
  var WORKS = [
    { key: 'car', chip: '🚗 Car / Bike', msgs: [
      ['English', 'Happy Ayudha Pooja! 🚗 May your wheels roll safely and every journey be blessed 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! 🚗 உங்கள் பயணங்கள் எல்லாம் பாதுகாப்பாக அமையட்டும் 🙏'],
      ['Tanglish', 'Ayudha Pooja wishes! 🚗 Vandi wash pannita? Lemon ready ah? 😄🙏'],
    ] },
    { key: 'tools', chip: '🔧 Workshop / Tools', msgs: [
      ['English', 'Happy Ayudha Pooja! 🔧 May your tools work hard and your hands stay blessed 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! 🔧 உழைப்பு எல்லாம் உயர்வு தரட்டும் 🙏'],
      ['Tanglish', 'Ayudha Pooja wishes! 🔧 Indha varusham ellam velai super-a nadakkattum 💪'],
    ] },
    { key: 'it', chip: '💻 IT / Office', msgs: [
      ['English', 'Happy Ayudha Pooja! 💻 May your code compile first time and your bugs stay away 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! 💻 வேலையில் வெற்றி மேல் வெற்றி கிடைக்கட்டும் 🙏'],
      ['Tanglish', 'Laptop-ku sandhanam kumkumam vachaachu! 💻 Indha varusham zero bugs 😄🙏'],
    ] },
    { key: 'factory', chip: '⚙️ Factory / Machines', msgs: [
      ['English', 'Happy Ayudha Pooja! ⚙️ May the machines run smooth and production keep growing 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! ⚙️ தொழில் மேன்மேலும் வளரட்டும் 🙏'],
      ['Tanglish', 'Machine-ku pooja mudinjiduchu! ⚙️ Production double aagattum 😄'],
    ] },
    { key: 'shop', chip: '🛒 Shop / Business', msgs: [
      ['English', 'Happy Ayudha Pooja! 🛒 May your business grow and your cash box overflow 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! 🛒 வியாபாரம் செழிக்கட்டும் 🙏'],
      ['Tanglish', 'Kadai la kallapetti full aagattum! 🛒💰 Ayudha Pooja wishes!'],
    ] },
    { key: 'farm', chip: '🚜 Farming', msgs: [
      ['English', 'Happy Ayudha Pooja! 🌾 May the fields stay green and the harvest be rich 🙏'],
      ['தமிழ்', 'ஆயுத பூஜை வாழ்த்துக்கள்! 🌾 விளைச்சல் பெருகட்டும் 🙏'],
      ['Tanglish', 'Indha varusham vivasayam semma-va irukkattum! 🌾🚜'],
    ] },
    { key: 'student', chip: '📚 Student', msgs: [
      ['English', 'Happy Pooja! 📚 May every exam be easy and every answer right 🙏'],
      ['தமிழ்', 'சரஸ்வதி பூஜை வாழ்த்துக்கள்! 📚 கல்வியில் சிறந்து விளங்க வாழ்த்துக்கள் 🙏'],
      ['Tanglish', 'Books-ku pooja pannita, ini exam easy thaan 😄📚'],
    ] },
  ];
  var POOJA_FUN = ['Fun', 'Pooja holiday: 3 days off, 0 plans, 100% sundal 😂🪔'];
  var pjMode = POOJA_MODES[0], pjWork = WORKS[0];
  var item = ITEMS[0], rel = '', autoMsg = '', react = REACTS[0], award = AWARDS[0];

  var hash = new URLSearchParams(location.hash.slice(1));
  var ref = /^[a-z0-9]{1,12}$/.test(hash.get('r') || '') ? hash.get('r') : '';
  var SEASON_KIND = Date.now() < Date.parse('2026-10-23T00:00:00+05:30') ? 'pj' : 'bday';
  var kind = ['ty', 'rx', 'aw', 'pj', 'bday'].indexOf(hash.get('k')) >= 0 ? hash.get('k') : SEASON_KIND;
  if (hash.get('f')) $('from').value = hash.get('f').slice(0, 24);
  if (hash.get('t')) $('to').value = hash.get('t').slice(0, 24);
  history.replaceState(null, '', location.pathname);

  // Owner's own phone: ?me=1 once stops counting it (?me=0 to undo).
  var ME = false;
  try {
    var meQ = new URLSearchParams(location.search).get('me');
    if (meQ === '1') localStorage.setItem('wish_me', '1');
    if (meQ === '0') localStorage.removeItem('wish_me');
    ME = localStorage.getItem('wish_me') === '1';
  } catch (err) { /* private mode */ }

  function track(e, wid) {
    if (ME || !EVT_URL) return;
    var body = JSON.stringify({ e: e, k: kind, i: wid || '', r: ref });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(EVT_URL, new Blob([body], { type: 'text/plain' }));
      else fetch(EVT_URL, { method: 'POST', body: body, keepalive: true });
    } catch (err) { /* ignore */ }
  }

  function updateCount() { $('count').textContent = $('msg').value.length; }
  $('msg').addEventListener('input', updateCount);

  function setKind(k) {
    kind = k;
    var K = KINDS[k];
    $('heroEmoji').textContent = K.emoji;
    $('heroTitle').textContent = K.title;
    $('heroSub').textContent = K.sub;
    $('toLabel').textContent = K.toLabel;
    $('msgLabel').textContent = K.msgLabel;
    document.title = K.title + ' ' + K.emoji;
    document.querySelectorAll('.kind').forEach(function (b) { b.classList.toggle('active', b.dataset.kind === k); });
    document.dispatchEvent(new CustomEvent('wish:kind', { detail: k }));   // the 3D teaser follows the tab
    $('tyExtras').hidden = k !== 'ty';
    $('rxExtras').hidden = k !== 'rx';
    $('awExtras').hidden = k !== 'aw';
    $('pjExtras').hidden = k !== 'pj';
    $('pjWorkWrap').hidden = pjMode.key !== 'ay';
    if (k === 'pj' && !$('msg').value) setAutoMsg(msgChips()[0][1]);
    renderMsgChips();
    // Replying with a thank-you: start from a ready message so it takes one tap.
    if (k === 'ty' && ref && !$('msg').value) setAutoMsg(K.chips[0][1]);
    if (k === 'aw' && !$('msg').value) setAutoMsg(award.msgs[0][1]);
    var m = $('msg').value.trim();
    if (m && m === autoMsg && msgChips().length) setAutoMsg(msgChips()[0][1]);
  }

  function msgChips() {
    if (kind === 'pj') return (pjMode.key === 'sar' ? pjMode.msgs : pjWork.msgs).concat([POOJA_FUN]);
    if (kind === 'rx') return react.msgs;
    if (kind === 'aw') return award.msgs;
    return kind === 'ty' && item.msgs ? item.msgs : KINDS[kind].chips;
  }
  function setAutoMsg(text) {
    $('msg').value = text;
    autoMsg = text;
    updateCount();
  }
  function renderMsgChips() {
    var chips = $('chips');
    chips.innerHTML = '';
    msgChips().forEach(function (w) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = w[0];
      b.addEventListener('click', function () { setAutoMsg(w[1]); });
      chips.appendChild(b);
    });
  }

  function pickChips(box, list, isOn, onPick) {
    box.innerHTML = '';
    list.forEach(function (entry) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (isOn(entry) ? ' on' : '');
      b.textContent = entry.chip || entry[1];
      b.addEventListener('click', function () { onPick(entry); });
      box.appendChild(b);
    });
  }
  function renderPickers() {
    pickChips($('itemChips'), ITEMS, function (it) { return it === item; }, function (it) {
      item = it;
      // Swap in this treat's message unless the sender typed their own.
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(msgChips()[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('awardChips'), AWARDS, function (a) { return a === award; }, function (a) {
      award = a;
      $('customWrap').hidden = a.key !== 'custom';
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(a.msgs[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('reactChips'), REACTS, function (r) { return r === react; }, function (r) {
      react = r;
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(r.msgs[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('pjModeChips'), POOJA_MODES, function (m) { return m === pjMode; }, function (m) {
      pjMode = m;
      $('pjWorkWrap').hidden = m.key !== 'ay';
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(msgChips()[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('pjWorkChips'), WORKS, function (w) { return w === pjWork; }, function (w) {
      pjWork = w;
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(msgChips()[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('relChips'), RELS, function (r) { return r[0] === rel; }, function (r) {
      rel = rel === r[0] ? '' : r[0];
      renderPickers();
    });
  }
  renderPickers();
  document.querySelectorAll('.kind').forEach(function (b) {
    b.addEventListener('click', function () { setKind(b.dataset.kind); });
  });
  setKind(kind);
  track('create_open');

  function awardTitle() {
    if (award.key !== 'custom') return award.title;
    return ($('customTitle').value.trim() || 'Superstar').toUpperCase().replace(/\s*AWARD$/, '');
  }

  // One wish id per recipient+message, so preview + send count as a single wish.
  var current = { key: '', id: '', tracked: false };
  function newId() {
    var a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return Array.from(a, function (x) { return (x % 36).toString(36); }).join('');
  }

  function b64url(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function buildLink() {
    var to = $('to').value.trim();
    var from = $('from').value.trim();
    var msg = $('msg').value.trim();
    $('err').textContent = '';
    if (!to) {
      $('err').textContent = kind === 'ty' ? 'Please enter who you want to thank 🙂'
        : kind === 'bday' ? 'Please enter the birthday person’s name 🙂' : 'Please enter who it is for 🙂';
      $('to').focus();
      return null;
    }
    var key = [kind, to, from, msg, item.key, rel, react.key, award.key, $('customTitle').value, pjMode.key, pjWork.key].join('|');
    if (key !== current.key) current = { key: key, id: newId(), tracked: false };
    if (!current.tracked) { track('link_created', current.id); current.tracked = true; }
    var data = { k: kind, t: to, f: from, m: msg, i: current.id };
    if (kind === 'ty') {
      if (item.key !== 'heart') data.o = item.key;
      if (rel) data.l = rel;
    }
    if (kind === 'rx') {
      data.x = react.key;
      if (ref) data.y = 1;
    }
    if (kind === 'aw') {
      data.a = award.key;
      if (award.key === 'custom') data.c = $('customTitle').value.trim().slice(0, 28);
    }
    if (kind === 'pj') {
      data.s = pjMode.key;
      if (pjMode.key === 'ay') data.w = pjWork.key;
    }
    return { to: to, from: from, url: VIEW_URL[kind] + namesQuery(from, to) + '#d=' + b64url(JSON.stringify(data)) };
  }

  // Short first names for the WhatsApp preview ("Nithy sent you a Pooja gift, Gokul!").
  function namesQuery(from, to) {
    if (!from || !to) return '';
    var q = new URLSearchParams();
    q.set('f', from.slice(0, 24));
    q.set('t', to.slice(0, 24));
    return '?' + q.toString();
  }

  // Tap the 3D teaser: open the real experience as an uncounted preview, using what's typed so far.
  function kindExtras(data) {
    if (kind === 'ty') { if (item.key !== 'heart') data.o = item.key; if (rel) data.l = rel; }
    if (kind === 'rx') data.x = react.key;
    if (kind === 'aw') { data.a = award.key; if (award.key === 'custom') data.c = $('customTitle').value.trim().slice(0, 28); }
    if (kind === 'pj') { data.s = pjMode.key; if (pjMode.key === 'ay') data.w = pjWork.key; }
    return data;
  }
  $('teaser').addEventListener('click', function () {
    var data = kindExtras({ k: kind, t: $('to').value.trim() || 'You', f: $('from').value.trim() || 'Your friend', m: $('msg').value.trim(), i: '' });
    var url = VIEW_URL[kind] + '#d=' + b64url(JSON.stringify(data)) + '&p=1';
    if (!window.open(url, '_blank')) location.href = url;
  });

  $('waBtn').addEventListener('click', function () {
    var l = buildLink();
    if (!l) return;
    track('wa_share', current.id);
    var wa = 'https://wa.me/?text=' + encodeURIComponent(KINDS[kind].waText(l.to, l.url, l.from));
    if (!window.open(wa, '_blank')) location.href = wa;
  });

  $('previewBtn').addEventListener('click', function () {
    var l = buildLink();
    if (l) window.open(l.url + '&p=1', '_blank');  // p=1: sender preview, not counted
  });

  $('copyBtn').addEventListener('click', function () {
    var l = buildLink();
    if (!l) return;
    track('copy', current.id);
    var done = function () {
      $('toast').classList.add('show');
      setTimeout(function () { $('toast').classList.remove('show'); }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(l.url).then(done, function () { prompt('Copy this link:', l.url); });
    else prompt('Copy this link:', l.url);
  });
})();
