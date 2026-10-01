'use strict';

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { createHash, timingSafeEqual } = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = 'https://shreeramhometuitions.com';
const PHONE = '+91 9213723510';

mongoose.set('bufferCommands', false);

app.disable('x-powered-by');

app.use(express.urlencoded({
  extended: false,
  limit: '16kb',
  parameterLimit: 30
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Original model names preserve access to existing records.
const tutorSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  phone: String,
  subjects: String,
  experience: String,
  location: String,
  date: String,
  teacherType: String,
  qualification: String,
  preferredTimings: String,
  message: String
}, { timestamps: true });

const parentSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  phone: String,
  requirement: String,
  message: String,
  date: String,
  service: String,
  location: String,
  preferredTimings: String
}, { timestamps: true });

const Tutor = mongoose.model('Tutor', tutorSchema);
const Parent = mongoose.model('Parent', parentSchema);

const SERVICES = [
  'Primary School Tuition',
  'Middle School Tuition',
  'High School Tuition',
  'Mathematics',
  'Science',
  'English',
  'Computer Science',
  'Spoken English',
  'Music Lessons',
  'Shadow Teacher Support',
  'Other Learning Requirement'
];

const TEACHER_TYPES = [
  'School Tutor',
  'Spoken English Trainer',
  'Music Teacher',
  'Shadow Teacher',
  'Multiple Specialisations'
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

// Serve only public files, never server code or database records.
const publicFiles = [
  'about.html',
  'services.html',
  'contact.html',
  'faculty.html',
  'home-tuitions.html',
  'style.css',
  'script.js',
  'favicon.svg',
  'google49939a4e776229a4.html'
];

for (const file of publicFiles) {
  app.get('/' + file, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
}

app.get('/images/sangam-sharma.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'images', 'sangam-sharma.png'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  const query = new URL(req.originalUrl, SITE_URL).search;
  res.redirect(301, '/' + query);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /register-tutor',
    'Disallow: /contact$',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const pages = [
    '/',
    '/about.html',
    '/services.html',
    '/faculty.html',
    '/home-tuitions.html',
    '/contact.html'
  ];

  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(page =>
      `  <url><loc>${SITE_URL}${page}</loc></url>`
    ).join('\n') +
    '\n</urlset>'
  );
});

function reply(req, res, status, message) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.accepts(['html', 'json']) === 'json') {
    return res.status(status).json({ message });
  }

  return res.status(status).send(`<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Submission | Shree Ram Tuitions</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="section">
<div class="container">
<div class="form-panel tutor-panel">
<span class="eyebrow">Shree Ram Tuitions</span>
<h1>${status < 400 ? 'Thank you!' : 'Please check your submission'}</h1>
<p>${escapeHtml(message)}</p>
<div class="button-group">
<a class="btn" href="/contact.html">Contact page</a>
<a class="btn btn-secondary" href="/">Home</a>
</div>
</div>
</div>
</main>
</body>
</html>`);
}

function validateSubmission(req, res, next) {
  const teacher = req.path === '/register-tutor';

  const limits = teacher ? {
    name: 100,
    email: 254,
    phone: 20,
    teacherType: 200,
    subjects: 200,
    experience: 10,
    qualification: 200,
    location: 200,
    preferredTimings: 200,
    message: 2000
  } : {
    name: 100,
    email: 254,
    phone: 20,
    service: 200,
    location: 200,
    requirement: 200,
    preferredTimings: 200,
    message: 2000
  };

  const required = teacher
    ? [
        'name', 'email', 'phone', 'teacherType',
        'subjects', 'experience', 'location'
      ]
    : ['name', 'phone', 'service', 'location', 'requirement'];

  const input = {};

  for (const [field, limit] of Object.entries(limits)) {
    const value = req.body?.[field];

    if (
      value !== undefined &&
      (typeof value !== 'string' || value.length > limit)
    ) {
      return reply(
        req, res, 400,
        'Please enter valid details within the field limits.'
      );
    }

    input[field] = (value || '').trim();
  }

  if (
    required.some(field => !input[field]) ||
    input.name.length < 2
  ) {
    return reply(
      req, res, 400,
      'Please complete all required fields. Names must contain at least two characters.'
    );
  }

  const mobilePattern =
    /^(?:\+91[ -]?|91[ -]?|0)?[6-9](?:[ -]?[0-9]){9}$/;

  if (!mobilePattern.test(input.phone)) {
    return reply(
      req, res, 400,
      'Please enter a valid 10-digit Indian mobile number, optionally with +91.'
    );
  }

  if (
    input.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
  ) {
    return reply(req, res, 400, 'Please enter a valid email address.');
  }

  if (teacher) {
    const years = Number(input.experience);

    if (!TEACHER_TYPES.includes(input.teacherType)) {
      return reply(
        req, res, 400,
        'Please select a valid teacher category.'
      );
    }

    if (
      !Number.isFinite(years) ||
      years < 0 ||
      years > 80 ||
      years % 0.5 !== 0
    ) {
      return reply(
        req, res, 400,
        'Experience must be between 0 and 80 years, in half-year increments.'
      );
    }

    input.experience = String(years);
  } else if (!SERVICES.includes(input.service)) {
    return reply(
      req, res, 400,
      'Please select a valid learning service.'
    );
  }

  if (mongoose.connection.readyState !== 1) {
    return reply(
      req, res, 503,
      `Online submissions are temporarily unavailable. Please try again later or call ${PHONE}.`
    );
  }

  req.validatedInput = input;
  next();
}

function saveSubmission(Model, successMessage) {
  return async (req, res) => {
    try {
      const now = new Date();

      await Model.create({
        ...req.validatedInput,
        id: now.getTime(),
        date: now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata'
        })
      });

      return reply(req, res, 201, successMessage);
    } catch {
      console.error(
        'Submission could not be confirmed. Check database availability.'
      );

      return reply(
        req, res, 500,
        `We could not confirm your submission. Please contact us on ${PHONE} before sending it again.`
      );
    }
  };
}

app.post(
  '/contact',
  validateSubmission,
  saveSubmission(
    Parent,
    'Thank you! Your learning enquiry has been received. We will contact you to discuss your requirements.'
  )
);

app.post(
  '/register-tutor',
  validateSubmission,
  saveSubmission(
    Tutor,
    'Thank you! Your teacher registration has been received for review.'
  )
);

function secureEqual(actual, expected) {
  const hash = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(actual), hash(expected));
}

function adminAuth(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return res.status(503).send(
      'Admin access is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD on the server.'
    );
  }

  const header = req.headers.authorization || '';

  if (/^Basic /i.test(header)) {
    const decoded = Buffer.from(
      header.slice(6), 'base64'
    ).toString('utf8');

    const separator = decoded.indexOf(':');

    if (separator > 0) {
      const correctUsername = secureEqual(
        decoded.slice(0, separator), username
      );

      const correctPassword = secureEqual(
        decoded.slice(separator + 1), password
      );

      if (correctUsername && correctPassword) return next();
    }
  }

  res.setHeader(
    'WWW-Authenticate',
    'Basic realm="Shree Ram Tuitions Admin", charset="UTF-8"'
  );

  return res.status(401).send(
    'Administrator authentication required.'
  );
}

function display(value) {
  const empty =
    value === undefined || value === null || value === '';

  return escapeHtml(empty ? '—' : value);
}

function recordDate(record) {
  if (record.createdAt) {
    return new Date(record.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });
  }

  return record.date || '—';
}

function renderRows(records, teacher) {
  if (!records.length) {
    return '<tr><td colspan="7">No matching records found.</td></tr>';
  }

  return records.map(record => {
    const email = record.email && record.email !== 'N/A'
      ? `<div>${display(record.email)}</div>`
      : '';

    const contact = `
      <strong>${display(record.name)}</strong>
      <div>${display(record.phone)}</div>
      ${email}
    `;

    if (teacher) {
      return `<tr>
<td>${contact}</td>
<td>${display(record.teacherType || 'School Tutor')}</td>
<td>${display(record.subjects)}</td>
<td>${display(record.experience)} years
<div>${display(record.qualification)}</div></td>
<td>${display(record.location)}</td>
<td>${display(record.preferredTimings)}
<div class="message">${display(record.message)}</div></td>
<td>${display(recordDate(record))}</td>
</tr>`;
    }

    return `<tr>
<td>${contact}</td>
<td>${display(record.service || 'School Tuition')}</td>
<td>${display(record.requirement)}</td>
<td>${display(record.location)}</td>
<td>${display(record.preferredTimings)}</td>
<td class="message">${display(record.message)}</td>
<td>${display(recordDate(record))}</td>
</tr>`;
  }).join('');
}

app.get('/admin', adminAuth, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send(
      'Database unavailable. Please try again later.'
    );
  }

  const teacher = req.query.view === 'teachers';
  const view = teacher ? 'teachers' : 'enquiries';

  const search = typeof req.query.q === 'string'
    ? req.query.q.trim().slice(0, 100)
    : '';

  const requestedPage =
    typeof req.query.page === 'string' &&
    /^\d{1,6}$/.test(req.query.page)
      ? Math.max(1, Number(req.query.page))
      : 1;

  const Model = teacher ? Tutor : Parent;

  const fields = teacher
    ? ['name', 'email', 'phone', 'teacherType', 'subjects', 'location']
    : ['name', 'email', 'phone', 'service', 'requirement', 'location'];

  const literalSearch = search.replace(
    /[.*+?^${}()|[\]\\]/g, '\\$&'
  );

  const filter = search ? {
    $or: fields.map(field => ({
      [field]: {
        $regex: literalSearch,
        $options: 'i'
      }
    }))
  } : {};

  try {
    const [enquiryCount, teacherCount, matches] = await Promise.all([
      Parent.countDocuments({}).maxTimeMS(8000),
      Tutor.countDocuments({}).maxTimeMS(8000),
      Model.countDocuments(filter).maxTimeMS(8000)
    ]);

    const pageSize = 25;
    const pages = Math.max(1, Math.ceil(matches / pageSize));
    const page = Math.min(requestedPage, pages);

    const records = await Model.find(filter)
      .sort({ id: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .maxTimeMS(8000)
      .lean();

    const url = target => '/admin?' + new URLSearchParams({
      view,
      q: search,
      page: String(target)
    });

    const headings = teacher
      ? [
          'Teacher / Contact',
          'Category',
          'Specialisation',
          'Experience / Qualifications',
          'Localities',
          'Availability / Notes',
          'Registered'
        ]
      : [
          'Learner / Contact',
          'Service',
          'Requirement',
          'Locality',
          'Preferred Timings',
          'Message',
          'Received'
        ];

    res.send(`<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin | Shree Ram Tuitions</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
<style>
body{background:#f8fafc}
.admin-wrap{max-width:1400px;margin:auto;padding:32px 20px}
.admin-heading,.admin-tabs,.pagination{
display:flex;align-items:center;justify-content:space-between;
gap:16px;flex-wrap:wrap}
.admin-heading{margin-bottom:28px}
.admin-tabs{justify-content:flex-start;margin:24px 0}
.admin-stats{
display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.admin-stats strong{display:block;font-size:2rem;color:#13243a}
.admin-search{
display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:24px 0}
.admin-search .form-field{flex:1;min-width:200px}
.table-scroll{
overflow-x:auto;background:#fff;border:1px solid #e2e8f0;
border-radius:14px}
table{
border-collapse:collapse;width:100%;min-width:1100px;font-size:.85rem}
th,td{
padding:16px;text-align:left;vertical-align:top;
border-bottom:1px solid #e2e8f0}
th{background:#13243a;color:#fff}
td{max-width:280px;overflow-wrap:anywhere}
.message{white-space:pre-wrap}
.pagination{margin-top:24px}
@media(max-width:480px){
.admin-stats{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="admin-wrap">
<div class="admin-heading">
<div>
<span class="eyebrow">Shree Ram Tuitions</span>
<h1>Admin Dashboard</h1>
</div>
<a class="btn btn-secondary" href="/">Website</a>
</div>

<div class="admin-stats">
<div class="card">
Learning enquiries<strong>${enquiryCount}</strong>
</div>
<div class="card">
Teacher registrations<strong>${teacherCount}</strong>
</div>
</div>

<nav class="admin-tabs" aria-label="Record type">
<a class="btn ${teacher ? 'btn-secondary' : ''}"
href="/admin?view=enquiries"
${teacher ? '' : 'aria-current="page"'}>
Learning Enquiries
</a>
<a class="btn ${teacher ? '' : 'btn-secondary'}"
href="/admin?view=teachers"
${teacher ? 'aria-current="page"' : ''}>
Teacher Registrations
</a>
</nav>

<form class="admin-search" method="get" action="/admin">
<input type="hidden" name="view" value="${view}">
<div class="form-field">
<label for="search">
Search names, contact details, services or localities
</label>
<input id="search" name="q"
value="${escapeHtml(search)}"
maxlength="100" type="search">
</div>
<button class="btn" type="submit">Search</button>
<a class="btn btn-secondary" href="/admin?view=${view}">Clear</a>
</form>

<p>
${matches} matching record${matches === 1 ? '' : 's'} ·
Latest first · Dates in India Standard Time
</p>

<div class="table-scroll" role="region"
aria-label="${teacher ? 'Teacher registrations' : 'Learning enquiries'}"
tabindex="0">
<table>
<thead>
<tr>
${headings.map(title =>
  `<th scope="col">${title}</th>`
).join('')}
</tr>
</thead>
<tbody>${renderRows(records, teacher)}</tbody>
</table>
</div>

<nav class="pagination" aria-label="Pagination">
<span>Page ${page} of ${pages}</span>
<div class="button-group">
${page > 1
  ? `<a class="btn btn-secondary"
href="${escapeHtml(url(page - 1))}">Previous</a>`
  : ''}
${page < pages
  ? `<a class="btn btn-secondary"
href="${escapeHtml(url(page + 1))}">Next</a>`
  : ''}
</div>
</nav>
</main>
</body>
</html>`);
  } catch {
    console.error('Admin records could not be loaded.');

    res.status(503).send(
      'Unable to load records right now. Please try again later.'
    );
  }
});

app.use((req, res) => {
  reply(
    req, res, 404,
    'This page could not be found. Please return to the home or contact page.'
  );
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status =
    error.status === 413 ? 413 :
    error.status === 400 ? 400 :
    error.status === 404 ? 404 : 500;

  const message =
    status === 413
      ? 'Your submission is too large. Please shorten it.'
      : status === 400
      ? 'Invalid submission. Please check your details.'
      : status === 404
      ? 'The requested file could not be found.'
      : 'Something went wrong. Please try again later.';

  reply(req, res, status, message);
});

function connectDatabase() {
  const uri = process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/shreeramtuitions';

  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000
  })
    .then(() => console.log('MongoDB connected.'))
    .catch(() => {
      console.error(
        'MongoDB unavailable. Check MONGO_URI and database access. Retrying in 15 seconds.'
      );

      setTimeout(connectDatabase, 15000).unref();
    });
}

if (require.main === module) {
  connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
  });
}

module.exports = { app, Tutor, Parent, escapeHtml };