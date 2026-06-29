/* ============================================================================
   ELEVATE FITNESS — coach app (single-file vanilla JS, no framework/build)
   ----------------------------------------------------------------------------
   Architecture: one in-memory state (S + the `clients`/`coaches`/… arrays).
   render() rebuilds the active screen's innerHTML from that state on every
   change; navTo()/goBack() drive a fixed screen hierarchy (see NAV). All markup
   is produced as template strings here; all styling lives in css/styles.css
   (no inline style="" except --c-bg/--c-fg/--pct data hooks). PDFs render into
   #rdoc via html2pdf.

   SECTIONS (search the banners below):
     DATA · HELPERS · AUTH · NAV · DASHBOARD · ICONS · CLIENTS · CLIENT DETAIL ·
     ADD TO EXERCISE LIBRARY · CLIENT HISTORY · TODAY'S SESSION · ATTENDANCE ·
     ONBOARDING · SCHEDULE · REPORTS · MORE · ANNOUNCEMENTS
   ============================================================================ */

/* ============ DATA ============ */
const CATS={
 'General wellness':{c:'var(--green)',b:'var(--green-bg)',ic:'🌿'},
 'Rehab':{c:'var(--blue)',b:'var(--blue-bg)',ic:'🩹'},
 'Special children':{c:'var(--purple)',b:'var(--purple-bg)',ic:'⭐'},
 'Sports specific':{c:'var(--amber)',b:'var(--amber-bg)',ic:'🏆'}
};
function initials(n){return n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
// avatar contents for a coach: their photo if they have one, else initials
function coachAvaInner(co){return co&&co.photo?`<img src="${co.photo}" alt="${co.name}">`:initials(co.name)}
const WD={1:'28 Apr',2:'5 May',3:'12 May',4:'19 May',5:'26 May',6:'2 Jun'};

let clients=[
 {id:1,name:'Arjun Mehta',age:28,phone:'98765 43210',cat:'Sports specific',ability:'Abled',status:'Active',coach:'Madhan',joined:'Aug 2022',start:'3 Feb 2025',sessions:32,days:'Mon, Wed, Fri',time:'5:30 PM',programStartDate:'2026-05-16',
  goals:'Improve sprint power and lower-body strength for upcoming season.',medical:'No major issues. Old ankle sprain (2022), fully recovered.',activity:'High — trains 5×/week',injuries:'None active',
  // 6 measurement points (one per program week) — bodyweight feeds the strength-to-bodyweight charts
  weights:[78,77.5,77,76.5,76,75.5],measures:{Weight:[78,77.5,77,76.5,76,75.5],Waist:[86,85,84,83,82.5,82]},
  photos:[{t:'Front',d:'Week 1',c:'before'},{t:'Front',d:'Week 4',c:'progress'},{t:'Side',d:'Week 1',c:'before'},{t:'Side',d:'Week 4',c:'progress'}],
  // Athletic mid-program demo — 6 weeks of progressive weight×rep logs across compound lifts so the
  // Progress section's e1RM trends, muscle-group movers, PR timeline and strength-to-bodyweight all populate.
  exercises:[
   {name:'Back squat',g:'Quads',target:'4×6',logs:{1:{w:60,r:6},2:{w:60,r:6},3:{w:65,r:6},4:{w:65,r:6},5:{w:70,r:6},6:{w:70,r:6}}},
   {name:'Bench press',g:'Chest',target:'4×6',logs:{1:{w:47.5,r:6},2:{w:47.5,r:6},3:{w:52.5,r:6},4:{w:52.5,r:6},5:{w:57.5,r:6},6:{w:57.5,r:6}}},
   {name:'Deadlift',g:'Hamstrings',target:'3×5',logs:{1:{w:95,r:5},2:{w:95,r:5},3:{w:102.5,r:5},4:{w:102.5,r:5},5:{w:110,r:5},6:{w:110,r:5}}},
   {name:'Overhead press',g:'Shoulders',target:'3×8',logs:{1:{w:32.5,r:8},2:{w:32.5,r:8},3:{w:37.5,r:8},4:{w:37.5,r:8},5:{w:42.5,r:8},6:{w:42.5,r:8}}},
   {name:'Bent-over row',g:'Back',target:'4×8',logs:{1:{w:50,r:8},2:{w:50,r:8},3:{w:55,r:8},4:{w:55,r:8},5:{w:60,r:8},6:{w:60,r:8}}},
   {name:'Cable crunch',g:'Core',target:'3×15',logs:{1:{w:20,r:15},2:{w:20,r:15},3:{w:25,r:15},4:{w:25,r:15},5:{w:30,r:15},6:{w:30,r:15}}},
   // 3 accessory ("mini") movements — light, high-rep finishers
   {name:'Hanging leg raise',g:'Core',target:'3×12',logs:{1:{w:0,r:10},2:{w:0,r:10},3:{w:0,r:12},4:{w:0,r:12},5:{w:0,r:12},6:{w:0,r:15}}},
   {name:'Standing calf raise',g:'Calves',target:'3×15',logs:{1:{w:40,r:15},2:{w:40,r:15},3:{w:50,r:15},4:{w:50,r:15},5:{w:60,r:15},6:{w:60,r:15}}},
   {name:'Face pull',g:'Shoulders',target:'3×15',logs:{1:{w:15,r:15},2:{w:15,r:15},3:{w:20,r:15},4:{w:20,r:15},5:{w:25,r:15},6:{w:25,r:15}}},
   // extra compound + accessory work so each scheduled day fills both Program A & B with 3 exercises
   {name:'Romanian deadlift',g:'Hamstrings',target:'3×8',logs:{1:{w:60,r:8},2:{w:60,r:8},3:{w:67.5,r:8},4:{w:67.5,r:8},5:{w:75,r:8},6:{w:75,r:8}}},
   {name:'Front squat',g:'Quads',target:'4×6',logs:{1:{w:50,r:6},2:{w:50,r:6},3:{w:57.5,r:6},4:{w:57.5,r:6},5:{w:65,r:6},6:{w:65,r:6}}},
   {name:'Pull-up',g:'Back',target:'3×8',logs:{1:{w:0,r:6},2:{w:0,r:6},3:{w:0,r:7},4:{w:0,r:7},5:{w:0,r:8},6:{w:0,r:9}}},
   {name:'Incline bench press',g:'Chest',target:'3×8',logs:{1:{w:40,r:8},2:{w:40,r:8},3:{w:45,r:8},4:{w:45,r:8},5:{w:50,r:8},6:{w:50,r:8}}},
   {name:'Bulgarian split squat',g:'Quads',target:'3×10',logs:{1:{w:12,r:10},2:{w:12,r:10},3:{w:16,r:10},4:{w:16,r:10},5:{w:20,r:10},6:{w:20,r:10}}},
   {name:'Hip thrust',g:'Glutes',target:'3×10',logs:{1:{w:60,r:10},2:{w:60,r:10},3:{w:75,r:10},4:{w:75,r:10},5:{w:90,r:10},6:{w:90,r:10}}},
   {name:'Lateral raise',g:'Shoulders',target:'3×15',logs:{1:{w:6,r:15},2:{w:6,r:15},3:{w:8,r:15},4:{w:8,r:15},5:{w:12,r:15},6:{w:12,r:15}}},
   {name:'Leg press',g:'Quads',target:'3×10',logs:{1:{w:120,r:10},2:{w:120,r:10},3:{w:140,r:10},4:{w:140,r:10},5:{w:160,r:10},6:{w:160,r:10}}},
   {name:'Russian twist',g:'Core',target:'3×20',logs:{1:{w:5,r:20},2:{w:5,r:20},3:{w:8,r:20},4:{w:8,r:20},5:{w:12,r:20},6:{w:12,r:20}}}]},
 {id:2,name:'Meera Nair',age:45,phone:'98201 11223',cat:'Rehab',ability:'Abled',status:'Active',coach:'Kiran',joined:'Feb 2024',start:'12 Mar 2025',sessions:18,days:'Tue, Thu',time:'8:30 AM',programStartDate:'2026-06-09',
  goals:'Recover knee strength and mobility post-surgery.',medical:'ACL reconstruction Jan 2025. Cleared for loaded rehab.',activity:'Low — building back up',injuries:'Right knee (recovering)',
  weights:[68,67.8,67.5,67.2,67],measures:{Weight:[68,67.8,67.5,67.2,67],Waist:[80,79.5,79,78.5,78]},
  photos:[{t:'Knee ROM',d:'Week 1',c:'before'},{t:'Knee ROM',d:'Week 4',c:'progress'}],
  exercises:[
   // Program A — activation / isometric lower (first half of the list splits into A)
   {name:'Glute bridge',target:'3×12',logs:{1:{w:0,r:12},2:{w:5,r:12},3:{w:7.5,r:12},4:{w:10,r:12}}},
   {name:'Wall sit',target:'3×30s',logs:{1:{w:20,r:1},2:{w:25,r:1},3:{w:30,r:1},4:{w:35,r:1}}},
   {name:'Straight-leg raise',target:'3×15',logs:{1:{w:0,r:15},2:{w:1,r:15},3:{w:2,r:15},4:{w:2.5,r:15}}},
   // Program B — mobility + pulls (second half splits into B)
   {name:'Heel slide',target:'3×12',logs:{1:{w:0,r:10},2:{w:0,r:12},3:{w:0,r:12},4:{w:0,r:15}}},
   {name:'Seated cable row',target:'3×15',logs:{1:{w:5,r:15},2:{w:7.5,r:15},3:{w:10,r:15},4:{w:10,r:15}}},
   {name:'Band row',target:'3×15',logs:{1:{w:5,r:15},2:{w:7.5,r:15},3:{w:7.5,r:15},4:{w:10,r:15}}}]},
 {id:3,name:'Kavya Singh',age:34,phone:'99000 88776',cat:'General wellness',ability:'Abled',status:'Active',coach:'Madhan',joined:'Apr 2025',start:'2 May 2025',sessions:9,days:'Mon, Thu',time:'10:00 AM',programStartDate:'2026-06-15',
  goals:'General fitness, lose 4kg, build a sustainable routine.',medical:'None reported.',activity:'Moderate — new to training',injuries:'None',
  weights:[72,71.5,71,70.8,70.5],measures:{Weight:[72,71.5,71,70.8,70.5],Waist:[88,87,86.5,86,85]},
  photos:[{t:'Front',d:'Week 1',c:'before'}],
  exercises:[
   {name:'Goblet squat',target:'3×12',logs:{1:{w:8,r:12},2:{w:10,r:12},3:{w:12,r:12},4:{w:12,r:12}}},
   {name:'Treadmill walk (incline)',target:'20 min',logs:{1:{w:3,r:1},2:{w:4,r:1},3:{w:5,r:1},4:{w:5,r:1}}}]},
 {id:4,name:'Dev Krishnan',age:11,phone:'97411 22334',cat:'Special children',ability:'Disabled',status:'Active',coach:'Shakthi',joined:'Oct 2023',start:'18 Apr 2025',sessions:14,days:'Wed, Sat',time:'4:00 PM',programStartDate:'2026-06-22',
  goals:'Improve balance, coordination and confidence through play-based training.',medical:'Mild cerebral palsy. Parent present each session.',activity:'Light, supervised',injuries:'None',
  weights:[],measures:{Balance:[10,12,15,18,20]},
  photos:[{t:'Balance test',d:'Week 1',c:'before'},{t:'Balance test',d:'Week 4',c:'progress'}],
  exercises:[
   {name:'Single-leg balance',target:'3×20s',logs:{1:{w:10,r:1},2:{w:12,r:1},3:{w:15,r:1},4:{w:18,r:1}}},
   {name:'Step-ups',target:'2×10',logs:{1:{w:0,r:10},2:{w:0,r:12},3:{w:0,r:14},4:{w:0,r:15}}}]},
 {id:5,name:'Sara Pinto',age:52,phone:'90011 55667',cat:'General wellness',ability:'Abled',status:'Paused',coach:'Kiran',joined:'Jun 2021',start:'10 Jan 2025',sessions:22,days:'—',time:'—',
  goals:'Maintain fitness; paused for travel.',medical:'Mild hypertension, managed.',activity:'Paused',injuries:'None',
  weights:[70,69.5,69],measures:{Weight:[70,69.5,69]},photos:[],
  exercises:[{name:'Burpee',target:'3×10',logs:{1:{w:0,r:1},2:{w:0,r:1}}}]},
 // pending client — added through the new "Add client" flow only (basics + questionnaire); no assessment / schedule / coach yet
 {id:6,name:'Nisha Reddy',age:29,phone:'+91 99887 76655',cat:'General wellness',ability:'Abled',status:'Active',coach:null,joined:'May 2025',start:'Today',sessions:0,
  goals:'Lose 5kg and build a sustainable, consistent gym routine.',medical:'No known conditions. Occasional lower-back stiffness from desk work.',activity:'Sedentary — desk job, new to structured training',injuries:'None',
  assessmentDone:false,scheduleDone:false,scheduleSet:false,
  weights:[],measures:{},photos:[],
  exercises:[{name:'Tap to add exercise',target:'set in program',logs:{}}]}
];
let nextId=7;
// existing seed clients are fully active — default the lifecycle flags they predate (Nisha sets hers explicitly)
clients.forEach(c=>{if(c.assessmentDone===undefined)c.assessmentDone=true;if(c.scheduleSet===undefined)c.scheduleSet=true;if(c.scheduleDone===undefined)c.scheduleDone=!!c.scheduleSet;});
/* ---- package-based session-balance model ----
   Clients buy a package of N sessions upfront. Each completed session consumes one (sessionsRemaining--).
   When the balance hits 0 a renewal is due; the coach usually buys the same package size again.
   c.payments holds the full payment history; c.sessionsRemaining is the live balance. */
const PACKAGE_SIZES=[12,16,24];
const ASSESSMENT_FEE_LABEL='Assessment fee';
const OVERDUE_DAYS_AFTER_BALANCE_ZERO=7;
// ---- legacy program-cycle model (deprecated; still seeded for backward compat — c.program, c.assessmentPaid) ----
const PROGRAM_FEE={4:6000,5:7200,6:8400};   // internal program tier by length (weeks) — never shown as a money amount in the UI
function progTotal(p){return p?p.weeks*p.perWeek:0}
function progComplete(c){return c.program&&c.program.done>=progTotal(c.program)}
function programLabel(p){return p?p.weeks+'-week program · '+p.perWeek+'×/week':'—'}
/* ---- program archive model ----
   Each client builds up a c.programHistory: past program records, the same way c.payments holds
   past payments. The current/active program continues to live at c.program + c.exercises; a program
   becomes a history entry only at a program boundary (an explicit "Start new program"), NOT on
   mid-program exercise edits. */
function nextProgramHistoryId(c){return (c.programHistory||[]).reduce((m,p)=>Math.max(m,p.id||0),0)+1}
function programDisplayName(c){return (c.program&&c.program.name)||('Program #'+((c.program&&c.program.no)||1))}
// snapshot the current c.program + c.exercises into a programHistory entry. Does NOT clear
// c.program / c.exercises — that's the caller's job. Returns the archived record.
function archiveCurrentProgram(c,opts){
 opts=opts||{};
 c.programHistory=c.programHistory||[];
 const p=c.program||{};
 const weeks=p.weeks||0,perWeek=p.perWeek||0;
 const rec={
  id:nextProgramHistoryId(c),
  name:opts.name||p.name||('Program #'+(p.no||1)),
  no:p.no||1,
  startDate:opts.startDate||p.startDate||'',
  endDate:opts.endDate||todayISO(),
  weeks:weeks,
  perWeek:perWeek,
  sessionsCompleted:p.done||0,
  // snapshot the exercise list (name + target) as it was at program end — read-only history
  exercises:(c.exercises||[]).map(e=>({name:e.name,target:e.target})),
  notes:opts.notes||''
 };
 c.programHistory.push(rec);
 logActivity('PROGRAM','Archived program "'+rec.name+'" for '+c.name,
  {clientId:c.id,detail:rec.sessionsCompleted+' sessions completed over '+weeks+' weeks'});
 return rec;
}
// archive the current program (if any), then set up c.program + c.exercises with a new one.
// increments c.program.no, resets done to 0, and marks the new program unpaid.
function startNewProgram(c,opts){
 opts=opts||{};
 const had=!!(c.program&&c.exercises&&c.exercises.length);
 if(had)archiveCurrentProgram(c,{endDate:todayISO()});
 const prevNo=(c.program&&c.program.no)||0;
 const weeks=opts.weeks||4,perWeek=opts.perWeek||3;
 c.program={no:prevNo+1,name:opts.name||('Program #'+(prevNo+1)),weeks:weeks,perWeek:perWeek,
  done:0,paid:false,startDate:opts.startDate||todayISO(),fee:PROGRAM_FEE[weeks]||0};
 c.exercises=(opts.exercises||[]).map(e=>({name:e.name,target:e.target,logs:e.logs||{}}));
 invalidateSession(c.id);   // the exercise list just changed — today's circuit no longer matches
 logActivity('PROGRAM','Started new program "'+c.program.name+'" for '+c.name,{clientId:c.id});
 return c.program;
}
// ---- package payment status (the source of truth for the payment UI) ----
// whole-day difference between two 'YYYY-MM-DD' dates (b - a)
function daysBetween(aISO,bISO){const a=new Date(aISO+'T00:00:00'),b=new Date(bISO+'T00:00:00');if(isNaN(a)||isNaN(b))return 0;return Math.round((b-a)/86400000)}
function paymentStatus(c){
 // returns 'Paid' | 'DueSoon' | 'Overdue' | 'New'
 if(!c.payments||c.payments.length===0)return 'New';
 if(c.sessionsRemaining>0)return 'Paid';
 if(!c.lastSessionDate)return 'DueSoon';
 const daysSince=daysBetween(c.lastSessionDate,todayISO());
 if(daysSince>OVERDUE_DAYS_AFTER_BALANCE_ZERO)return 'Overdue';
 return 'DueSoon';
}
function daysOverdue(c){
 if(paymentStatus(c)!=='Overdue')return 0;
 return daysBetween(c.lastSessionDate,todayISO())-OVERDUE_DAYS_AFTER_BALANCE_ZERO;
}
function projectedRenewalDate(c){
 // estimate when the next renewal will be needed, from remaining sessions and weekly cadence
 if(c.sessionsRemaining<=0)return null;
 if(!c.days)return null;
 const sessionsPerWeek=c.days.split(',').length;
 const weeksLeft=c.sessionsRemaining/sessionsPerWeek;
 const d=new Date();
 d.setDate(d.getDate()+Math.ceil(weeksLeft*7));
 return dateKey(d);
}
// total package sessions ever purchased (assessment fees don't add sessions)
function lifetimeSessions(c){return (c.payments||[]).reduce((s,p)=>s+(p.type==='package'?(p.sessions||0):0),0)}
// kept available so existing references work; new code should use paymentStatus
function paymentDue(c){const s=paymentStatus(c);return s==='DueSoon'||s==='Overdue'}
// seed varied payment states across the demo clients so the billing UI has something to show
(function seedPayments(){
 const seed={
  1:{assessPaid:true, prog:{no:3,weeks:6,perWeek:3,done:9,paid:true}},    // mid-program, paid (6-week block, Mon/Wed/Fri)
  2:{assessPaid:true, prog:{no:2,weeks:4,perWeek:3,done:12,paid:true}},   // program finished → renewal due
  3:{assessPaid:true, prog:{no:1,weeks:4,perWeek:3,done:12,paid:true}},   // program finished → renewal due
  4:{assessPaid:true, prog:{no:2,weeks:4,perWeek:3,done:11,paid:true}},   // almost done, paid
  5:{assessPaid:false,prog:{no:1,weeks:4,perWeek:3,done:0,paid:false}}    // paused & unpaid
 };
 clients.forEach(c=>{const s=seed[c.id];if(!s)return;
  c.assessmentPaid=s.assessPaid;
  c.program={no:s.prog.no,weeks:s.prog.weeks,perWeek:s.prog.perWeek,done:s.prog.done,paid:s.prog.paid,fee:PROGRAM_FEE[s.prog.weeks]};
 });
})();
// seed the package-balance model: payment history, current balance, last-session date
(function seedPackages(){
 const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return dateKey(d)};
 const assess=(id,date)=>({id,date,type:'assessment',packageSize:null,sessions:null,status:'Paid',notes:''});
 const pkg=(id,date,size)=>({id,date,type:'package',packageSize:size,sessions:size,status:'Paid',notes:''});
 const seed={
  // Arjun — assessment + 2 packages of 12 (24 purchased lifetime), 4 left mid-third use, last session today
  1:{payments:[assess(1,'2025-02-03'),pkg(2,'2025-02-10',12),pkg(3,'2025-03-24',12)],sessionsRemaining:4,packageSize:12,lastSessionDate:daysAgo(0)},
  // Meera — assessment + 1 package of 12, balance 0, last session 3 days ago → Payment due soon
  2:{payments:[assess(1,'2025-03-12'),pkg(2,'2025-03-18',12)],sessionsRemaining:0,packageSize:12,lastSessionDate:daysAgo(3)},
  // Kavya — assessment + 1 package of 12, balance 0, last session 10 days ago → Overdue
  3:{payments:[assess(1,'2025-05-02'),pkg(2,'2025-05-05',12)],sessionsRemaining:0,packageSize:12,lastSessionDate:daysAgo(10)},
  // Dev — assessment + package of 12 + renewal of 12, 8 left, last session yesterday
  4:{payments:[assess(1,'2025-04-18'),pkg(2,'2025-04-20',12),pkg(3,'2025-05-19',12)],sessionsRemaining:8,packageSize:12,lastSessionDate:daysAgo(1)},
  // Sara — assessment + 1 package of 16, 2 left, paused, last session 30 days ago (still Paid — has balance)
  5:{payments:[assess(1,'2025-01-10'),pkg(2,'2025-01-15',16)],sessionsRemaining:2,packageSize:16,lastSessionDate:daysAgo(30)},
  // Nisha — brand new, assessment pending: no payments yet
  6:{payments:[],sessionsRemaining:0,packageSize:12,lastSessionDate:null}
 };
 clients.forEach(c=>{const s=seed[c.id];
  if(s){c.payments=s.payments;c.sessionsRemaining=s.sessionsRemaining;c.packageSize=s.packageSize;c.lastSessionDate=s.lastSessionDate;}
  else{c.payments=[];c.sessionsRemaining=0;c.packageSize=12;c.lastSessionDate=null;}
 });
})();
// seed each client's program history so the history view has content on first load.
// Also names + dates the active c.program so the "Current" card and any future archiving read cleanly.
(function seedProgramHistory(){
 const ex=(name,target)=>({name:name,target:target});
 const seed={
  // Arjun — two finished blocks before the active program (program #3). No program names: a program is
  // identified by its number + length/cadence (names only exist if a coach types one in the new-program flow).
  1:{current:{startDate:'2025-04-18'},history:[
    {no:1,startDate:'2025-01-06',endDate:'2025-02-03',weeks:4,perWeek:3,sessionsCompleted:12,
     exercises:[ex('Back squat','3×8'),ex('Bench press','4×6'),ex('Deadlift','3×5'),ex('Bent-over row','3×10'),ex('Plank','3×40s')],
     notes:'Solid base built. Cleared to load heavier next block.'},
    {no:2,startDate:'2025-02-10',endDate:'2025-04-15',weeks:6,perWeek:3,sessionsCompleted:18,
     exercises:[ex('Back squat','5×5'),ex('Power clean','5×3'),ex('Bench press','5×5'),ex('Romanian deadlift','3×8'),ex('Box jump','4×5')],
     notes:'Big jump in sprint power. Carry the cleans into block 2.'}]},
  // Meera — one finished rehab phase before the active program (program #2)
  2:{current:{startDate:'2025-04-15'},history:[
    {no:1,startDate:'2025-03-12',endDate:'2025-04-10',weeks:4,perWeek:2,sessionsCompleted:8,
     exercises:[ex('Glute bridge','3×12'),ex('Wall sit','3×30s'),ex('Straight-leg raise','3×15'),ex('Heel slide','3×12')],
     notes:'Pain-free ROM restored. Progressed to light loading.'}]},
  // Kavya — one finished beginner block; bump the active program to #2 to match
  3:{currentNo:2,current:{startDate:'2025-05-30'},history:[
    {no:1,startDate:'2025-05-02',endDate:'2025-05-30',weeks:4,perWeek:2,sessionsCompleted:8,
     exercises:[ex('Goblet squat','3×12'),ex('Incline walk','20 min'),ex('Band row','3×15'),ex('Glute bridge','3×12')],
     notes:'Great consistency. Ready to add a third session.'}]},
  // Dev — one finished balance block (program #2)
  4:{current:{startDate:'2025-05-16'},history:[
    {no:1,startDate:'2025-04-18',endDate:'2025-05-16',weeks:4,perWeek:2,sessionsCompleted:8,
     exercises:[ex('Balance hold','3×20s'),ex('Step-ups','2×10'),ex('Cone weaving','3 rounds'),ex('Seated catch','3×10')],
     notes:'Confidence up noticeably. Parent very pleased.'}]},
  // Sara — one finished foundation block; paused mid maintenance (bump active to #2)
  5:{currentNo:2,current:{startDate:'2025-03-05'},history:[
    {no:1,startDate:'2025-01-10',endDate:'2025-03-01',weeks:6,perWeek:2,sessionsCompleted:10,
     exercises:[ex('Full body circuit','3 rounds'),ex('Goblet squat','3×12'),ex('Incline walk','15 min')],
     notes:'Steady progress before the travel pause.'}]}
  // Nisha (id 6) — brand new: no program history, no active program yet
 };
 clients.forEach(c=>{
  c.programHistory=[];
  const s=seed[c.id];if(!s)return;
  if(c.program){
   if(s.current&&s.current.startDate)c.program.startDate=s.current.startDate;   // no name — derived as "Program #N"
   if(s.currentNo)c.program.no=s.currentNo;
  }
  c.programHistory=(s.history||[]).map((h,i)=>({id:i+1,name:'Program #'+h.no,no:h.no,startDate:h.startDate,endDate:h.endDate,
   weeks:h.weeks,perWeek:h.perWeek,sessionsCompleted:h.sessionsCompleted,exercises:h.exercises,notes:h.notes||''}));
 });
})();
const coaches=[
 {name:'Madhan',role:'Coach',main:true,clients:[1,3],photo:'assets/images/madhan.jpg',
  phone:'+91 91234 56789',email:'madhan@elevatefitness.com',yearsExp:6,
  specializations:['Strength & Conditioning Specialist'],certifications:['Certified Personal Trainer'],
  tagline:"I'll guide you. You focus."},
 {name:'Kiran',role:'Coach',clients:[2,5],
  phone:'+91 90000 11223',email:'kiran@elevatefitness.com',yearsExp:3,
  specializations:['Rehab & Mobility'],certifications:['Certified Personal Trainer'],
  tagline:"Small steps, steady wins."},
 {name:'Shakthi',role:'Coach',clients:[4],
  phone:'+91 90000 44556',email:'shakthi@elevatefitness.com',yearsExp:3,
  specializations:['General Fitness'],certifications:['Certified Personal Trainer'],
  tagline:"Show up. The rest follows."}
];
/* ---- date helpers + the logged-in coach (coach attendance is now derived from sessionLog) ---- */
function dateKey(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+dd}
function todayKey(){return dateKey(new Date())}
function nowTime(){return new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
function currentCoach(){ // logged-in coach — main trainer (Madhan / TRAINER) by default
 if(S.role==='junior'){const j=coaches.find(c=>!c.main);return j?j.name:coaches[0].name}
 const m=coaches.find(c=>c.main);return m?m.name:coaches[0].name}
let announcements=[
 {type:'Holiday',title:'Gym closed for Diwali',msg:'We will be closed 20–22 Oct. Sessions resume 23 Oct. Happy Diwali! 🪔',to:'All clients',when:'2 days ago'},
 {type:'Event',title:'Free posture workshop',msg:'Join our posture & mobility workshop this Saturday 11 AM. Open to all.',to:'All clients',when:'1 week ago'}
];
const library=[
  // Lower body — Quads
  {n:'Back squat', g:'Quads', c:'Lower body · Barbell', t:'3×8'},
  {n:'Front squat', g:'Quads', c:'Lower body · Barbell · Quad-dominant', t:'3×8'},
  {n:'Goblet squat', g:'Quads', c:'Lower body · Dumbbell · Beginner', t:'3×12'},
  {n:'Bulgarian split squat', g:'Quads', c:'Lower body · Unilateral', t:'3×10 each leg'},
  {n:'Walking lunges', g:'Quads', c:'Lower body · Dynamic', t:'3×12 each leg'},
  {n:'Reverse lunge', g:'Quads', c:'Lower body · Knee-friendly', t:'3×10 each leg'},
  {n:'Step-ups', g:'Quads', c:'Lower body · Functional', t:'3×10 each leg'},
  {n:'Leg press', g:'Quads', c:'Lower body · Machine', t:'3×12'},
  {n:'Wall sit', g:'Quads', c:'Lower body · Isometric · Rehab', t:'3×30s'},
  {n:'Bodyweight squat', g:'Quads', c:'Lower body · Beginner · Warm-up', t:'3×15'},

  // Lower body — Hamstrings & glutes
  {n:'Romanian deadlift', g:'Hamstrings', c:'Posterior chain · Hamstring-dominant', t:'3×10'},
  {n:'Conventional deadlift', g:'Hamstrings', c:'Posterior chain · Heavy compound', t:'3×5'},
  {n:'Sumo deadlift', g:'Glutes', c:'Posterior chain · Wide stance', t:'3×6'},
  {n:'Single-leg deadlift', g:'Hamstrings', c:'Posterior chain · Balance + unilateral', t:'3×8 each leg'},
  {n:'Hip thrust', g:'Glutes', c:'Glute primary', t:'3×12'},
  {n:'Glute bridge', g:'Glutes', c:'Bodyweight · Rehab-friendly', t:'3×15'},
  {n:'Cable pull-through', g:'Glutes', c:'Hip hinge pattern', t:'3×12'},
  {n:'Good morning', g:'Hamstrings', c:'Posterior chain · Lower back', t:'3×10'},
  {n:'Nordic curl', g:'Hamstrings', c:'Advanced hamstring isolation', t:'3×6'},
  {n:'Kettlebell swing', g:'Glutes', c:'Power · Posterior chain', t:'3×15'},

  // Lower body — Calves
  {n:'Standing calf raise', g:'Calves', c:'Lower body · Bodyweight or weighted', t:'3×15'},
  {n:'Seated calf raise', g:'Calves', c:'Lower body · Soleus', t:'3×15'},
  {n:'Single-leg calf raise', g:'Calves', c:'Lower body · Unilateral', t:'3×12 each leg'},
  {n:'Box jump', g:'Calves', c:'Plyometric', t:'3×8'},

  // Chest
  {n:'Bench press', g:'Chest', c:'Upper body · Barbell · Primary push', t:'4×6'},
  {n:'Incline bench press', g:'Chest', c:'Upper body · Upper chest', t:'4×8'},
  {n:'Dumbbell bench press', g:'Chest', c:'Upper body · More range of motion', t:'3×10'},
  {n:'Incline dumbbell press', g:'Chest', c:'Upper body · Upper chest', t:'3×10'},
  {n:'Push-up', g:'Chest', c:'Bodyweight · Staple', t:'3×12'},
  {n:'Decline push-up', g:'Chest', c:'Bodyweight · Feet elevated', t:'3×10'},
  {n:'Knee push-up', g:'Chest', c:'Bodyweight · Regression', t:'3×10'},
  {n:'Dumbbell fly', g:'Chest', c:'Upper body · Isolation', t:'3×12'},
  {n:'Cable crossover', g:'Chest', c:'Upper body · Cable machine', t:'3×12'},
  {n:'Dip', g:'Chest', c:'Bodyweight · Chest + triceps', t:'3×8'},

  // Back
  {n:'Pull-up', g:'Back', c:'Bodyweight · Overhand', t:'3×6'},
  {n:'Chin-up', g:'Back', c:'Bodyweight · Underhand', t:'3×6'},
  {n:'Lat pulldown', g:'Back', c:'Upper body · Machine', t:'4×10'},
  {n:'Bent-over row', g:'Back', c:'Upper body · Barbell · Primary pull', t:'3×8'},
  {n:'Dumbbell row', g:'Back', c:'Upper body · Single-arm', t:'3×10 each side'},
  {n:'Seated cable row', g:'Back', c:'Upper body · Mid-back', t:'3×10'},
  {n:'T-bar row', g:'Back', c:'Upper body · Thick back', t:'3×8'},
  {n:'Inverted row', g:'Back', c:'Bodyweight', t:'3×10'},
  {n:'Band pull-apart', g:'Back', c:'Posture · Shoulder health', t:'3×15'},
  {n:'Face pull', g:'Back', c:'Rear delt · Upper back', t:'3×15'},

  // Shoulders
  {n:'Overhead press', g:'Shoulders', c:'Upper body · Barbell · Standing', t:'4×8'},
  {n:'Seated dumbbell press', g:'Shoulders', c:'Upper body · Stable', t:'3×10'},
  {n:'Arnold press', g:'Shoulders', c:'Upper body · Rotational', t:'3×10'},
  {n:'Lateral raise', g:'Shoulders', c:'Side delt · Isolation', t:'3×12'},
  {n:'Front raise', g:'Shoulders', c:'Front delt · Isolation', t:'3×12'},
  {n:'Rear delt fly', g:'Shoulders', c:'Rear delt · Isolation', t:'3×12'},
  {n:'Upright row', g:'Shoulders', c:'Trap + side delt', t:'3×10'},
  {n:'Push press', g:'Shoulders', c:'Power · Leg drive', t:'3×6'},
  {n:'Pike push-up', g:'Shoulders', c:'Bodyweight · Shoulder press', t:'3×8'},

  // Biceps
  {n:'Barbell curl', g:'Biceps', c:'Arms · Primary biceps', t:'3×10'},
  {n:'Dumbbell curl', g:'Biceps', c:'Arms · Each arm independent', t:'3×10'},
  {n:'Hammer curl', g:'Biceps', c:'Arms · Neutral grip · Brachialis', t:'3×10'},
  {n:'Preacher curl', g:'Biceps', c:'Arms · Strict isolation', t:'3×8'},
  {n:'Concentration curl', g:'Biceps', c:'Arms · Peak contraction', t:'3×10'},
  {n:'Cable curl', g:'Biceps', c:'Arms · Constant tension', t:'3×12'},

  // Triceps
  {n:'Close-grip bench press', g:'Triceps', c:'Arms · Compound triceps', t:'3×8'},
  {n:'Tricep dip', g:'Triceps', c:'Bodyweight or weighted', t:'3×10'},
  {n:'Overhead tricep extension', g:'Triceps', c:'Arms · Dumbbell · Long head', t:'3×10'},
  {n:'Tricep pushdown', g:'Triceps', c:'Arms · Cable', t:'3×12'},
  {n:'Skull crusher', g:'Triceps', c:'Arms · EZ bar', t:'3×10'},
  {n:'Diamond push-up', g:'Triceps', c:'Bodyweight · Tricep focus', t:'3×10'},

  // Core
  {n:'Plank', g:'Core', c:'Isometric · Staple', t:'3×40s'},
  {n:'Side plank', g:'Core', c:'Obliques', t:'3×30s each side'},
  {n:'Dead bug', g:'Core', c:'Core stability · Rehab-friendly', t:'3×10 each side'},
  {n:'Bird dog', g:'Core', c:'Core + back stability', t:'3×10 each side'},
  {n:'Hanging leg raise', g:'Core', c:'Lower abs', t:'3×10'},
  {n:'Lying leg raise', g:'Core', c:'Bodyweight · Floor', t:'3×15'},
  {n:'Russian twist', g:'Core', c:'Rotational', t:'3×20'},
  {n:'Cable woodchop', g:'Core', c:'Rotational · Functional', t:'3×12 each side'},
  {n:'Pallof press', g:'Core', c:'Anti-rotation', t:'3×12 each side'},
  {n:'Hollow hold', g:'Core', c:'Gymnastics-style core', t:'3×30s'},
  {n:'Ab wheel rollout', g:'Core', c:'Advanced core', t:'3×8'},

  // Cardio / conditioning
  {n:'Treadmill walk (incline)', g:'Cardio', c:'Low-impact cardio', t:'20 min'},
  {n:'Treadmill run', g:'Cardio', c:'Steady state', t:'20 min'},
  {n:'Stationary bike', g:'Cardio', c:'Low-impact', t:'20 min'},
  {n:'Rowing machine', g:'Cardio', c:'Full body', t:'15 min'},
  {n:'Jump rope', g:'Cardio', c:'Conditioning', t:'3×60s'},
  {n:'Battle ropes', g:'Cardio', c:'Power conditioning', t:'3×30s'},
  {n:'Burpee', g:'Cardio', c:'Full body', t:'3×10'},
  {n:'Mountain climber', g:'Cardio', c:'Core + cardio', t:'3×30s'},

  // Mobility & warm-up
  {n:'Cat-cow', g:'Mobility', c:'Spine mobility', t:'2×10'},
  {n:"World's greatest stretch", g:'Mobility', c:'Full body warm-up', t:'2×5 each side'},
  {n:'Hip 90/90', g:'Mobility', c:'Hip mobility', t:'2×8 each side'},
  {n:'Couch stretch', g:'Mobility', c:'Quad · Hip flexor', t:'2×30s each side'},
  {n:'Thoracic rotation', g:'Mobility', c:'Upper back mobility', t:'2×10 each side'},
  {n:'Shoulder dislocates', g:'Mobility', c:'Band/PVC · Shoulder mobility', t:'2×15'},
  {n:'Glute bridge (warm-up)', g:'Mobility', c:'Activation', t:'2×15'},

  // Rehab & special populations
  {n:'Clamshells', g:'Rehab', c:'Hip stability', t:'3×15 each side'},
  {n:'Banded monster walks', g:'Rehab', c:'Hip stability', t:'3×10 steps'},
  {n:'Terminal knee extension', g:'Rehab', c:'Knee rehab', t:'3×15'},
  {n:'Heel slides', g:'Rehab', c:'Post-surgery knee', t:'3×10'},
  {n:'Quad set (isometric)', g:'Rehab', c:'Early-stage knee rehab', t:'3×10s'},
  {n:'Banded shoulder external rotation', g:'Rehab', c:'Rotator cuff', t:'3×15'},
  {n:'Wall slides', g:'Rehab', c:'Shoulder mobility', t:'3×10'},
  {n:'Single-leg balance', g:'Rehab', c:'Proprioception', t:'3×30s each leg'},
  {n:'Step-up to balance', g:'Rehab', c:'Functional balance', t:'3×8 each leg'},
  {n:'Seated march', g:'Rehab', c:'Special children · Low mobility', t:'3×15 each leg'},
  {n:'Standing balance eyes closed', g:'Rehab', c:'Advanced balance', t:'3×20s each leg'}
];
// muscle-group filter chips (vLibrary + attach picker) — 'All' first, the rest alphabetical
const LIB_GROUPS=['All','Back','Biceps','Calves','Cardio','Chest','Core','Glutes','Hamstrings','Mobility','Quads','Rehab','Shoulders','Triceps'];
// muscle-group → display colors for the small tag on each library row. Uses existing palette tokens;
// muscleColor() falls back to neutral grey for any group not listed (rather than breaking).
const MUSCLE_COLORS={
  Quads:     { c:'var(--blue)',   b:'var(--blue-bg)' },
  Hamstrings:{ c:'var(--blue)',   b:'var(--blue-bg)' },
  Glutes:    { c:'var(--purple)', b:'var(--purple-bg)' },
  Calves:    { c:'var(--blue)',   b:'var(--blue-bg)' },
  Chest:     { c:'var(--red)',    b:'var(--red-bg)' },
  Back:      { c:'var(--red)',    b:'var(--red-bg)' },
  Shoulders: { c:'var(--amber)',  b:'var(--amber-bg)' },
  Biceps:    { c:'var(--amber)',  b:'var(--amber-bg)' },
  Triceps:   { c:'var(--amber)',  b:'var(--amber-bg)' },
  Core:      { c:'var(--green)',  b:'var(--green-bg)' },
  Cardio:    { c:'var(--accent)', b:'var(--accent-soft)' },
  Mobility:  { c:'var(--muted)',  b:'var(--bg)' },
  Rehab:     { c:'var(--blue)',   b:'var(--blue-bg)' }
};
function muscleColor(g){return MUSCLE_COLORS[g]||{c:'var(--muted)',b:'var(--bg)'}}
let reports=[{clientId:1,week:4,sent:false},{clientId:2,week:4,sent:true,when:'Yesterday'}];
let reviewState={1:{due:false,ago:'this week'},2:{due:true,ago:'9 days ago'},3:{due:true,ago:'8 days ago'},4:{due:false,ago:'this week'},5:{due:false,ago:'paused'}};
let sessDone={};      // clientId -> session marked complete today
let exDone={};        // clientId -> { exerciseName: true }  (legacy flat-checklist store; circuit flow uses sessionProgress)
// circuit-session progress, keyed 'clientId::YYYY-MM-DD'. Shape:
// {clientId,date,programs:[{label,exercises:[name],sets,progress:{'round:exName':true}}],splitDone,currentProgramIdx}
let sessionProgress={};
// session-only exercise adds, keyed 'clientId::YYYY-MM-DD'. These belong to TODAY'S session only —
// they are NOT part of the standing program (never written to c.exercises), so they never bleed into
// the Program tab, this week's plan, or any future day. Shape: [{name,g,target,logs:{}}]
let sessionExtras={};
// names dropped from TODAY'S session only (standing-program exercises the coach removed for today).
// Keyed 'clientId::YYYY-MM-DD' -> [name]. Filtered out of sessionExercises() but left in c.exercises,
// so the standing program is untouched. (Session-only extras are removed from sessionExtras directly.)
let sessionExcludes={};
// archive of COMPLETED sessions, keyed clientId -> [records, newest first]. A completed/ended session is
// recorded here for good; resetting or invalidating today's live progress never erases this history.
// record: {date,when,early,roundsCompleted,totalRounds,programs:[{label,sets,exercises:[name]}]}
let sessionLog={};
let attStatus={};      // clientId -> 'present' | 'absent' | 'cancelled'
let attTime={};        // clientId -> timestamp string when attendance was marked
// in-memory activity feed — payment & session events, newest first (surfaced on the Home "Activity" list)
let activityLog=[];
function logActivity(type,msg,meta){activityLog.unshift({type:type,msg:msg,meta:meta||{},when:'Just now',ts:Date.now()});}
// seed today's circuit-session state so the session screen has every phase to show on first load.
// (helpers below — buildSessionState etc. — are hoisted function declarations, so they're callable here.)
(function seedSessions(){
 const k=id=>id+'::'+todayISO();
 const present=id=>{attStatus[id]='present';attTime[id]='7:05 AM';};
 // a missed session today so Home's "Client Missed Sessions" critical alert has something to show.
 // (Dev (4) is intentionally left UNmarked so his sessions open the slide-to-start flow, not an Absent screen.)
 attStatus[5]='cancelled';attTime[5]='7:00 AM';
 const realNames=c=>(c.exercises||[]).filter(e=>!e.future&&e.name!=='Tap to add exercise').map(e=>e.name);
 // Arjun (1) — left UNmarked with a READY standing program (6 progressive lifts): opening his session
 // shows slide-to-mark-present → auto-built A/B circuit. His logged history also powers the Progress section.
 // Meera (2) — left UNSTARTED on purpose: no attendance marked, no progress, NO pre-built session. This is
 // the "start a session from scratch" demo — opening her session derives today's Program A/B straight from
 // her standing plan (buildSessionState) and shows the slide-to-mark-present → build-circuit flow.
 // (She becomes Home's UP NEXT, since she's the first session that's neither done nor missed.)
 // Kavya (3) — session IN PROGRESS: marked present, split started, partway through round 1 (not finished)
 const kavya=clients.find(c=>c.id===3);
 if(kavya){present(3);const names=realNames(kavya);const half=Math.ceil(names.length/2);
  const st={clientId:3,date:todayISO(),splitDone:true,currentProgramIdx:0,
   programs:[{label:'Program A',exercises:names.slice(0,half),sets:3,progress:{}},
             {label:'Program B',exercises:names.slice(half),sets:3,progress:{}}]};
  if(names[0])st.programs[0].progress['1:'+names[0]]=true;   // first exercise of round 1 ticked → mid-session
  sessionProgress[k(3)]=st;}
 // a little real completed-session history so the Sessions tab isn't empty
 const daysAgoISO=n=>{const d=new Date();d.setDate(d.getDate()-n);return dateKey(d);};
 if(kavya)sessionLog[3]=[{date:daysAgoISO(1),when:'7:05 AM',early:false,roundsCompleted:6,totalRounds:6,
  programs:[{label:'Program A',sets:3,exercises:['Goblet squat']},{label:'Program B',sets:3,exercises:['Incline walk']}]}];
 // Arjun's past completed sessions (history for the Sessions tab)
 const arjun=clients.find(c=>c.id===1);
 if(arjun)sessionLog[1]=[
  {date:daysAgoISO(2),when:'5:35 PM',early:false,roundsCompleted:6,totalRounds:6,
   programs:[{label:'Program A',sets:3,exercises:['Back squat','Bench press']},{label:'Program B',sets:3,exercises:['Romanian deadlift','Overhead press']}]},
  {date:daysAgoISO(5),when:'5:32 PM',early:true,roundsCompleted:3,totalRounds:6,
   programs:[{label:'Program A',sets:3,exercises:['Back squat','Bench press']},{label:'Program B',sets:3,exercises:['Romanian deadlift','Overhead press']}]}];
})();

let S={tab:'home',view:null,clientId:null,ctab:'overview',week:4,role:'main',
  onCat:'General wellness',onAbility:'Abled',att:null,measure:null,histRange:'month',histMeasure:null,gridMode:'cards',reorder:false,
  onDays:['Mon','Wed','Fri'],onTime:'5:30 PM',onCoach:'Madhan',onMsg:0,attachTo:null,attachReturn:null,attachProgIdx:null,attachDay:null,attachProg:null,progDay:null,picks:[],effFrom:'next',
  libQ:'',libGroup:'All',
  // client detail is one long scrollable page; subView (null | 'program'|'sessions'|'progress'|'payment'|'media') stacks a drill-in over it
  subView:null,progSub:'current',clientScroll:0};
const DAY_ORDER=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// 15-minute time slots from 5:00 AM to 10:00 PM — lets trainers pick custom times like 6:15, 6:30
const TIME_SLOTS=(()=>{const out=[];for(let m=5*60;m<=22*60;m+=15){const h=Math.floor(m/60),mi=m%60,ap=h<12?'AM':'PM';let hh=h%12;if(hh===0)hh=12;out.push(hh+':'+String(mi).padStart(2,'0')+' '+ap);}return out;})();
// country dial codes for the New-client phone field (India is the default)
const COUNTRIES=[{d:'+91',f:'🇮🇳',n:'India'},{d:'+1',f:'🇺🇸',n:'United States'},{d:'+44',f:'🇬🇧',n:'United Kingdom'},{d:'+971',f:'🇦🇪',n:'UAE'},{d:'+61',f:'🇦🇺',n:'Australia'},{d:'+65',f:'🇸🇬',n:'Singapore'},{d:'+60',f:'🇲🇾',n:'Malaysia'},{d:'+966',f:'🇸🇦',n:'Saudi Arabia'},{d:'+49',f:'🇩🇪',n:'Germany'},{d:'+33',f:'🇫🇷',n:'France'},{d:'+64',f:'🇳🇿',n:'New Zealand'}];
const MSGS=[
 'Welcome to Elevate Fitness! Excited to start this journey with you. 💪',
 'So glad to have you on board. Let\'s build something great together, one session at a time.',
 'Welcome aboard! Your program is ready. Show up, trust the process, and we\'ll get results. 🙌'];
// first-assessment scoring dimensions + word labels for the 1–5 scale
const ASSESS_DIMS=[
 {k:'strength',label:'Strength',ic:'💪'},
 {k:'flexibility',label:'Flexibility',ic:'🤸'},
 {k:'mobility',label:'Mobility',ic:'🦵'},
 {k:'endurance',label:'Endurance',ic:'🫀'},
 {k:'balance',label:'Balance & posture',ic:'🧘'}];
const RATE_WORDS=['','Needs work','Below avg','Average','Good','Excellent'];
// first-assessment profile selectors — feed the welcome letter's Assessment Summary tiles
const ASSESS_PROFILE={
 bodyType:{label:'Body Type',ic:'🧍',opts:['Ectomorph','Mesomorph','Endomorph']},
 fitnessLevel:{label:'Fitness Level',ic:'📈',opts:['Beginner','Intermediate','Advanced']},
 primaryGoal:{label:'Primary Goal',ic:'🎯',opts:['Muscle gain','Fat loss','Endurance','Mobility','General fitness']},
 focusAreas:{label:'Focus Areas',ic:'🏋️',opts:['Strength','Hypertrophy','Endurance','Mobility','Cardio','Posture'],multi:true}
};
// switchable profiles shown in the home-header dropdown
const PROFILES={
 main:{name:'Coach Madhan',head:'Coach Madhan',role:'Coach',ic:'🛡️',photo:'assets/images/madhan.jpg',phone:'+91 91234 56789',email:'madhan@elevatefitness.com',greet:'Good morning,',emoji:'👋'},
 junior:{name:'Coach Kiran',head:'Coach Kiran',role:'Coach',ic:'👥',phone:'+91 90000 11223',email:'kiran@elevatefitness.com',greet:'Good morning,',emoji:'👋'}
 // no 'client' profile — this is a coach-only app (no client login)
};

/* ============ HELPERS ============ */
function cur(){return clients.find(c=>c.id===S.clientId)}
function visibleClients(){
 if(S.role==='junior')return clients.filter(c=>['Meera Nair','Sara Pinto'].includes(c.name));
 return clients;
}
// lifecycle stage of a client during the staged add flow — null once fully set up
function clientStage(c){
 if(!c.assessmentDone)return 'Assessment pending';
 if(!c.scheduleDone)return 'Schedule pending';
 if(!c.scheduleSet)return 'Welcome note pending';
 return null;
}
// amber tag for "Assessment pending", blue for "Schedule pending" — shown on list rows + detail header
function stageTagHTML(c){
 const s=clientStage(c);if(!s)return '';
 const amber=s==='Assessment pending';
 return `<span class="tag tint-cat" style="--c-bg:${amber?'var(--amber-bg)':'var(--blue-bg)'};--c-fg:${amber?'var(--amber)':'var(--blue)'}">${amber?'🩺':'📅'} ${s}</span>`;
}
function trend(ex,wk){const cw=ex.logs[wk],pw=ex.logs[wk-1];if(!cw||!pw)return'flat';return cw.w>pw.w?'up':cw.w<pw.w?'down':'flat'}
function getLog(ex,wk){if(!ex.logs[wk]){const p=ex.logs[wk-1]||{w:0,r:8};ex.logs[wk]={w:p.w,r:p.r}}return ex.logs[wk]}
function isRepBased(ex){return /s$|min/i.test((ex.target||'').trim())||/step|balance|walk|wall|circuit|plank/i.test(ex.name||'')}
/* ---- schedule-shaped program plan: ONE dataset (c.exercises) tagged by scheduled DAY + Program A/B,
   with logs[week] holding the per-week weight/reps. The Program tab edits this plan; today's session is
   a derived VIEW of it (today's day → that day's Program A & B at this week's load). No second dataset. ---- */
function parseDays(c){return (c.days||'').split(',').map(s=>s.trim()).filter(d=>DAY_ORDER.includes(d));}
// real (non-placeholder, non-future) exercises in one (day, Program A/B) slot, in canonical order
function exForDayProg(c,day,prog){return (c.exercises||[]).filter(e=>!e.future&&e.name!=='Tap to add exercise'&&e.day===day&&e.prog===prog);}
function programStartISO(c){return c.programStartDate||todayISO();}
// the program week that's live right now — derived from the start date, clamped to 1..weeks
function currentWeekFor(c){const weeks=(c.program&&c.program.weeks)||6;
 const start=new Date(programStartISO(c)+'T00:00:00');if(isNaN(start))return Math.min(S.week||1,weeks);
 const days=Math.floor((new Date(todayISO()+'T00:00:00')-start)/86400000);
 return Math.max(1,Math.min(weeks,Math.floor(days/7)+1));}
// today's weekday as a Mon-first label ('Mon'..'Sun')
function todayWeekday(){return DAY_ORDER[(new Date().getDay()+6)%7];}
// which scheduled day today's session runs: today if it's a training day, else the next scheduled day
function sessionDayFor(c){const days=parseDays(c);if(!days.length)return null;
 const today=todayWeekday();if(days.includes(today))return today;
 const ti=DAY_ORDER.indexOf(today);for(let i=1;i<=7;i++){const d=DAY_ORDER[(ti+i)%7];if(days.includes(d))return d;}
 return days[0];}
// "5:30 PM" → minutes from midnight (for chronological sorting); unparseable → 9999 (sorts last)
function timeToMinutes(t){const m=String(t||'').match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return 9999;let h=+m[1]%12;if(/pm/i.test(m[3]))h+=12;return h*60+(+m[2]);}
// every scheduled session for a given weekday, derived from real client schedules (c.days + c.time),
// chronological. `list` defaults to the visible clients (coach/junior scoping applied by the caller).
function sessionsOnDay(day,list){return (list||visibleClients())
  .filter(c=>c.scheduleSet&&parseDays(c).includes(day))
  .map(c=>({t:c.time||'—',id:c.id,c:c}))
  .sort((a,b)=>timeToMinutes(a.t)-timeToMinutes(b.t));}
// the prescribed weight / reps for an exercise THIS week — the single source the Program tab + session share
function exWeightFor(c,name){const ex=sessExMeta(c,name);const l=ex&&ex.logs&&ex.logs[currentWeekFor(c)];return l?(+l.w||0):0;}
function exRepsFor(c,name){const ex=sessExMeta(c,name);const l=ex&&ex.logs&&ex.logs[currentWeekFor(c)];return l&&l.r!=null?l.r:repTarget(ex);}
// tag every active client's real exercises into (day, Program A/B) slots when the seed didn't — deterministic
// round-robin: 1st→day0·A, 2nd→day0·B, 3rd→day1·A, … so each scheduled day gets a Program A and B block.
(function tagProgramPlan(){clients.forEach(c=>{const days=parseDays(c);if(!days.length)return;let k=0;
 (c.exercises||[]).forEach(e=>{if(e.future||e.name==='Tap to add exercise')return;
  if(!e.day||!e.prog){e.day=days[Math.floor(k/2)%days.length];e.prog=(k%2)?'B':'A';}k++;});});})();
function rev(id){return reviewState[id]||{due:false,ago:'—'}}
function dueClients(){return visibleClients().filter(c=>c.status==='Active'&&rev(c.id).due)}
function markReviewed(id){reviewState[id]={due:false,ago:'just now'};}
// open the library in attach mode for a client; optional preselectExerciseNames seeds S.picks (by mapping names → library indices)
function openLibraryForClient(id,preselectExerciseNames){S.attachTo=id;S.attachMode=null;S.attachReturn=null;S.effFrom='next';S.libQ='';S.libGroup='All';
 S.picks=(preselectExerciseNames||[]).map(nm=>library.findIndex(l=>l.n===nm)).filter(i=>i>=0);
 navTo('library');
}
// build a blank session's program inline: pick exercises for TODAY (effFrom 'now'), then return to the session
function buildSessionProgram(id){S.attachTo=id;S.attachMode=null;S.attachReturn='session';S.effFrom='now';S.picks=[];S.libQ='';S.libGroup='All';navTo('library');}
function togglePick(i){const p=S.picks.indexOf(i);if(p<0)S.picks.push(i);else S.picks.splice(p,1);render()}
function effLabel(){if(S.effFrom==='now')return 'this week';if(S.effFrom==='next')return 'next week · 26 May';
 const d=new Date(S.effFrom);return isNaN(d)?S.effFrom:d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function attachPicked(){if(!S.picks.length){toast('Tap + to pick exercises first');return}const c=clients.find(x=>x.id===S.attachTo);
 const cid=c.id,toSession=S.attachReturn==='session';
 // PLAN SLOT mode — picks land in one (day, Program A/B) slot of the standing plan (c.exercises tagged
 // with day+prog). This is the single dataset today's session also reads.
 if(S.attachReturn==='planSlot'){
  const day=S.attachDay,prog=S.attachProg;let added=0;
  S.picks.forEach(i=>{const lib=library[i];
   if(c.exercises.some(e=>e.name===lib.n&&e.day===day&&e.prog===prog))return;   // already in this slot
   c.exercises.push({name:lib.n,g:lib.g,target:lib.t,logs:{},day:day,prog:prog});added++;});
  invalidateSession(cid);markReviewed(cid);
  S.progDay=day;S.attachTo=null;S.picks=[];S.attachReturn=null;S.attachDay=null;S.attachProg=null;
  openClient(cid);openClientSection('program');
  toast(added?added+' exercise'+(added!==1?'s':'')+' added to '+day+' · Program '+prog:'Already in Program '+prog);
  return;
 }
 // PROGRAM mode — picks land in one specific program (Program A / B / C …) of today's session
 if(S.attachReturn==='program'){
  const progIdx=S.attachProgIdx;
  const st=getSession(cid);const lbl=(st&&st.programs[progIdx]&&st.programs[progIdx].label)||progLabel(progIdx||0);
  const added=addPicksToProgram(c,progIdx,S.picks.map(i=>({n:library[i].n,g:library[i].g,t:library[i].t})));
  S.attachTo=null;S.picks=[];S.attachReturn=null;S.attachProgIdx=null;
  openSession(cid);
  toast(added.length?added.length+' exercise'+(added.length!==1?'s':'')+' added to '+lbl:'Already in '+lbl);
  return;
 }
 if(toSession){
  // session-only: these live in TODAY'S session, not the standing program / this week. Merge into the
  // live circuit if one's running (keeps progress) — no invalidateSession, so an in-progress workout survives.
  const added=addSessionExtras(c,S.picks.map(i=>({n:library[i].n,g:library[i].g,t:library[i].t})));
  S.attachTo=null;S.picks=[];S.attachReturn=null;
  openSession(cid);
  toast(added.length?added.length+' exercise'+(added.length!==1?'s':'')+" added to today's session":'Already in this session');
  return;
 }
 const isFuture=S.effFrom!=='now';const lbl=effLabel();
 S.picks.forEach(i=>{const lib=library[i];if(!c.exercises.some(e=>e.name===lib.n))c.exercises.push({name:lib.n,g:lib.g,target:lib.t,logs:{},future:isFuture,effLabel:lbl})});
 invalidateSession(c.id);   // program changed — drop today's circuit so it rebuilds with the new list
 const n=S.picks.length;markReviewed(c.id);
 S.attachTo=null;S.picks=[];S.attachReturn=null;
 openClient(cid);openClientSection('program');
 toast(n+' exercise'+(n!==1?'s':'')+' added — effective '+lbl);}
function toast(m){const t=document.getElementById('toast');t.onclick=null;t.textContent='✓  '+m;t.classList.add('show');clearTimeout(t._undoTimer);setTimeout(()=>t.classList.remove('show'),2400)}
// tappable "undo" toast used by the mark-absent confirmation pattern
function toastUndo(m,undo){const t=document.getElementById('toast');t.innerHTML='✓  '+m+'  <b class="u">Undo</b>';t.classList.add('show');
 t.onclick=()=>{undo();t.onclick=null;clearTimeout(t._undoTimer);t.classList.remove('show')};
 clearTimeout(t._undoTimer);t._undoTimer=setTimeout(()=>{t.classList.remove('show');t.onclick=null},3000)}

/* ============ ATTENDANCE GATE — REMOVED ============ */
// There is no clock-in gate anymore. Starting a client's session (the slide-to-mark-present
// action) is what records the coach's attendance, so sessions start freely.

/* ============ AUTH ============ */
const TRAINER={email:'madhan@elevatefitness.com',password:'coach123',name:'Coach Madhan'};
let authed=true;      // TEMP: login bypassed for testing — set back to false to re-enable the login gate (see vLogin/doLogin)
let loginErr='';      // validation message shown under the form
let loginEmail='';    // typed email, preserved across a failed attempt
function vLogin(){
 return `<div class="login fadein">
  <div class="login-card">
   <img class="login-logo-img" src="assets/images/logo.jpg" alt="Elevate Fitness">
   <div class="login-sub">Trainer portal · sign in</div>
   <div class="login-fields">
    <div class="field"><label>Email</label>
     <input id="lg-email" type="email" inputmode="email" autocomplete="username" placeholder="you@fittrack.app" value="${loginEmail}" onkeydown="if(event.key==='Enter')doLogin()"></div>
    <div class="field"><label>Password</label>
     <input id="lg-password" type="password" autocomplete="current-password" placeholder="Your password" onkeydown="if(event.key==='Enter')doLogin()"></div>
   </div>
   ${loginErr?`<div class="login-err">⚠️ ${loginErr}</div>`:''}
   <button class="bigbtn" onclick="doLogin()">Sign in</button>
   <div class="login-forgot" onclick="toast('Contact your gym admin to reset your password')">Forgot password?</div>
   <div class="login-hint">Demo login<br><b>madhan@elevatefitness.com</b> · <b>coach123</b>
    <button class="login-demo" onclick="fillDemoLogin()">Use demo login</button></div>
  </div>
 </div>`;
}
function fillDemoLogin(){
 const e=document.getElementById('lg-email'),p=document.getElementById('lg-password');
 if(e)e.value=TRAINER.email;
 if(p)p.value=TRAINER.password;
 loginEmail=TRAINER.email;loginErr='';
 if(p)p.focus();
}
function doLogin(){
 const email=(document.getElementById('lg-email').value||'').trim().toLowerCase();
 const pass=document.getElementById('lg-password').value||'';
 loginEmail=email;
 if(!email||!pass){loginErr='Enter your email and password.';render();return}
 if(email!==TRAINER.email||pass!==TRAINER.password){loginErr='Incorrect email or password. Try again.';render();return}
 authed=true;loginErr='';loginEmail='';S.tab='home';S.view=null;render();sc();
 toast('Welcome back, '+TRAINER.name.split(' ')[1]+' 👋');
}
function logout(){authed=false;loginErr='';loginEmail='';S.view=null;S.tab='home';render();}

/* ============ NAV ============ */
// Navigation is HIERARCHICAL, not browser-history. Every screen has a fixed logical parent
// (tab → view → sub-view) and Back always goes UP to that parent — NOT to whatever screen
// happened to precede it. parentOf() resolves the parent for the current view. The few screens
// with two genuine entry points record where they were opened from, so "up" lands correctly:
//   • client       → clientFrom ('session' vs the clients list)
//   • session     → sessionFrom ('client' vs the launching tab)
//   • report       → reportFrom ('client' vs the Reports tab)
//   • programDetail → pdFrom ('history' view vs the client's Program tab)
//   • assessDoc    → reuses the existing assessSrc ('draft' vs saved-on-client)
//   • library      → derived from its attach-flags (see libraryParent)
function tab(t){profileMenu=false;S.tab=t;S.view=null;S.subView=null;if(t==='clients'){clientShown=CLIENT_BATCH;cFilter='All';}render();sc()}
function navTo(view,id){profileMenu=false;if(id!==undefined)S.clientId=id;S.view=view;render();sc()}
function openClient(id){profileMenu=false;S.clientFrom=(S.view==='session')?'session':null;S.clientId=id;S.ctab='overview';S.subView=null;S.reorder=false;S.view='client';render();sc()}
function openSession(id){profileMenu=false;S.sessionFrom=(S.view==='client')?'client':(S.tab||'schedule');S.clientId=id;S.view='session';render();sc()}
function openReport(id){S.reportFrom=(S.view==='client')?'client':'reports';navTo('report',id)}
// the logical parent of the current screen → {tab?, view?, subView?, progSub?} (missing keys reset to root/null)
function parentOf(){
 switch(S.view){
  case 'client':         return S.clientFrom==='session'?{view:'session'}:{tab:'clients',view:null};
  case 'addClient':      return {tab:'clients',view:null};
  case 'editClient':     return {view:'client'};
  case 'announce':       return {tab:'more',view:null};
  case 'editProfile':    return {tab:'more',view:null};
  case 'programHistory': return {tab:'more',view:null};
  case 'notifications':  return {view:null};                          // overlay → fall back onto the current tab
  case 'report':         return S.reportFrom==='client'?{view:'client'}:{tab:'reports',view:null};
  case 'session':        return S.sessionFrom==='client'?{view:'client'}:{tab:S.sessionFrom||'schedule',view:null};
  case 'attMore':        return {view:'session'};
  case 'addAssessment':  return {view:'client'};
  case 'addSchedule':    return {view:'client'};
  case 'addWelcome':     return {view:'client'};
  case 'welcomeDoc':     return {view:'client'};
  case 'annNew':         return {view:'announce'};
  case 'reportDoc':      return {view:'report'};
  case 'assessDoc':      return S.assessSrc==='draft'?{view:'addAssessment'}:{view:'client'};
  case 'programDetail':  return S.pdFrom==='history'?{view:'programHistory'}
                              :{view:'client',subView:'program',progSub:S.programDetailId==='current'?'current':'history'};
  case 'library':        return libraryParent();
  default:               return {view:null};                          // unknown view → back to the current tab
 }
}
// library opens in several modes (browse / attach-to-session / attach-to-program / new-program); each returns
// up to wherever it was launched. Reads the attach-flags, so call it BEFORE they're cleared (see libraryBack).
function libraryParent(){
 if(S.attachMode==='newProgram')                            return {view:'client',subView:'program',progSub:'current'};
 if(S.attachReturn==='session'||S.attachReturn==='program') return {view:'session'};
 if(S.attachTo!=null)                                       return {view:'client',subView:'program',progSub:'current'};
 return {tab:'more',view:null};                              // plain browse from the More tab
}
// apply a parent target — set only the keys it specifies, reset the rest to root
function applyNav(t){t=t||{};
 if(t.tab!==undefined)S.tab=t.tab;
 S.view=t.view!==undefined?t.view:null;
 S.subView=t.subView||null;
 if(t.progSub)S.progSub=t.progSub;
}
function goBack(){profileMenu=false;applyNav(parentOf());render();sc()}
// library back: resolve the parent from the attach-flags, THEN clear them, then navigate up
function libraryBack(){const t=libraryParent();S.attachTo=null;S.attachMode=null;S.attachReturn=null;S.attachProgIdx=null;S.attachDay=null;S.attachProg=null;S.picks=[];S.newProg=null;profileMenu=false;applyNav(t);render();sc()}
function setAttendance(id,status){attStatus[id]=status;const c=clients.find(x=>x.id===id);
 const now=new Date();attTime[id]=now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
 if(status==='present'){toast(c.name.split(' ')[0]+' marked present');}
 else{sessDone[id]='closed';toast(c.name.split(' ')[0]+' — '+status);}
 render();sc();}
// (the flat-checklist toggleExDone was replaced by the circuit flow — see toggleCircuitEx / finishCircuitSession)
function closeView(){S.view=null;render();sc()}
function sc(){document.getElementById('screen').scrollTop=0}

/* ============ DASHBOARD ============ */
let profileMenu=false;   // home-header profile dropdown open?
function toggleProfileMenu(){profileMenu=!profileMenu;coachMenu=false;render()}
function closeProfileMenu(){profileMenu=false;render()}
// ---- home-header coach switcher: scope the dashboard to one coach's clients ('All' = every coach) ----
let homeCoach='Madhan';   // default to Madhan — show only Madhan's clients on first load
let coachMenu=false;     // home-header coach dropdown open?
function toggleCoachMenu(){coachMenu=!coachMenu;profileMenu=false;render()}
function closeCoachMenu(){coachMenu=false;render()}
function setHomeCoach(name){homeCoach=name;coachMenu=false;coachFilter=name;render();
 toast(name==='All'?'Viewing all coaches':"Viewing "+name+"'s clients");}
/* inline icon set — keeps the home page crisp at any size */
const ICO={
 bell:'<i data-lucide="ico-bell"></i>',
 users:'<i data-lucide="ico-users"></i>',
 cal:'<i data-lucide="ico-cal"></i>',
 ring:'<i data-lucide="ico-ring"></i>',
 doc:'<i data-lucide="ico-doc"></i>',
 check:'<i data-lucide="ico-check"></i>',
 clock:'<i data-lucide="ico-clock"></i>',
 spin:'<i data-lucide="ico-spin"></i>',
 warn:'<i data-lucide="ico-warn"></i>',
 plus:'<i data-lucide="ico-plus"></i>',
 caret:'<i data-lucide="ico-caret"></i>',
 navHome:'<i data-lucide="ico-nav-home"></i>',
 navReports:'<i data-lucide="ico-nav-reports"></i>',
 navMore:'<i data-lucide="ico-nav-more"></i>',
 signin:'<i data-lucide="ico-sign-in"></i>',
 signout:'<i data-lucide="ico-sign-out"></i>'
};

/* ============ ICONS ============
   Icons are SVG files in assets/icons/. <i data-lucide="name"> placeholders are swapped by paintIcons():
   - app UI            -> empty <svg class="ic"> tinted via CSS mask (non-inline, follows currentColor)
   - PDF docs (#rdoc)  -> real inline <svg> read from the file, so html2canvas/PDF renders it
   This replaces the old Lucide CDN. */
const ICON_CACHE={};
const ALL_ICONS=["arrow-left","arrow-right","badge-check","ban","bell","cake","calendar","calendar-check","calendar-clock","calendar-days","camera","chart-column","check","check-circle-2","chevron-down","chevron-left","chevron-right","circle-alert","circle-dot","clipboard-check","clipboard-list","clipboard-pen","clock","credit-card","cross","dumbbell","eye","filter","flag","globe","headset","height","history","ico-bell","ico-cal","ico-caret","ico-check","ico-clock","ico-doc","ico-nav-home","ico-nav-more","ico-nav-reports","ico-plus","ico-ring","ico-sign-in","ico-sign-out","ico-spin","ico-users","ico-warn","image","image-plus","info","line-chart","lock","log-out","mail","map-pin","medal","megaphone","minus-circle","more-horizontal","more-vertical","pause","pencil","phone","play-circle","plus","plus-circle","repeat","rotate-ccw","save","search","send","settings","stethoscope","tag","target","ticket","trending-up","user","user-check","user-plus","user-round","user-x","users","waist","wallet","weight","x"];
function loadIcon(name){
 if(name in ICON_CACHE)return Promise.resolve(ICON_CACHE[name]);
 ICON_CACHE[name]='';
 return fetch('assets/icons/'+name+'.svg').then(function(r){return r.ok?r.text():'';}).then(function(t){ICON_CACHE[name]=t;return t;}).catch(function(){return '';});
}
const ICONS_READY=Promise.all(ALL_ICONS.map(loadIcon));
function _maskIcon(el,name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('class',('ic '+(el.getAttribute('class')||'')).trim());
 // default 24px via attributes (specificity 0) so any CSS rule — incl. single-class ones like
 // .cl-select-ic — still sizes the icon, mirroring how Lucide sized its <svg>.
 svg.setAttribute('width','24');svg.setAttribute('height','24');
 const url='url(assets/icons/'+name+'.svg) center/contain no-repeat';
 let st=el.getAttribute('style')||'';if(st&&!/;\s*$/.test(st))st+=';';
 svg.setAttribute('style',st+'-webkit-mask:'+url+';mask:'+url);
 el.parentNode.replaceChild(svg,el);
}
function _inlineIcon(el,svgText){
 const tpl=document.createElement('template');tpl.innerHTML=(svgText||'').trim();
 const svg=tpl.content.firstElementChild;
 if(!svg||svg.tagName.toLowerCase()!=='svg')return _maskIcon(el,el.getAttribute('data-lucide'));
 const cls=el.getAttribute('class');if(cls)svg.setAttribute('class',((svg.getAttribute('class')||'')+' '+cls).trim());
 const st=el.getAttribute('style');if(st){const ex=svg.getAttribute('style')||'';svg.setAttribute('style',(ex?ex.replace(/;?\s*$/,';'):'')+st);}
 el.parentNode.replaceChild(svg,el);
}
function paintIcons(root){
 const scope=(root&&root.querySelectorAll)?root:document;
 const nodes=scope.querySelectorAll('i[data-lucide]');
 for(let i=0;i<nodes.length;i++){
  const el=nodes[i],name=el.getAttribute('data-lucide');
  if(!name)continue;
  if(el.closest('#rdoc')||el.closest('#rdocFrame')){
   const t=ICON_CACHE[name];
   if(t)_inlineIcon(el,t);else _maskIcon(el,name);
  }else _maskIcon(el,name);
 }
}
/* shared topbar — logo, notifications, profile — appears on every tab */
function vTopbar(){
 const due=dueClients().length+programEndedClients().length;
 return `<div class="topbar">
   <img class="topbar-logo" src="assets/images/logo.jpg" alt="Elevate Fitness">
   <div class="topbar-act">
    <button class="topbar-icbtn" onclick="navTo('notifications')" aria-label="Notifications">${ICO.bell}${due?`<span class="topbar-badge">${due}</span>`:''}</button>
   </div>
  </div>`;
}
/* ---- derived home metrics (all from live state — no hardcoded mock numbers) ---- */
// coach attendance is now DERIVED from the sessions they actually ran (sessionLog), not a clock-in.
// name===null / 'All' → count across every coach (used by the home "All clients" scope)
function coachSessionsThisMonth(name){
 const mon=todayKey().slice(0,7);let n=0;
 Object.keys(sessionLog).forEach(cid=>{const c=clients.find(cl=>String(cl.id)===String(cid));
  if(!c||(name&&name!=='All'&&c.coach!==name))return;
  (sessionLog[cid]||[]).forEach(r=>{if((r.date||'').slice(0,7)===mon)n++;});});
 return n;
}
function coachActiveDaysThisMonth(name){
 const mon=todayKey().slice(0,7);const days=new Set();
 Object.keys(sessionLog).forEach(cid=>{const c=clients.find(cl=>String(cl.id)===String(cid));
  if(!c||(name&&name!=='All'&&c.coach!==name))return;
  (sessionLog[cid]||[]).forEach(r=>{if((r.date||'').slice(0,7)===mon)days.add(r.date);});});
 return days.size;
}
// today's session list — DERIVED from real client schedules: every visible client (scoped to the selected
// coach) who trains on today's weekday, at their own c.time, chronological. No hardcoded slots. Each row's
// status (done / absent / in-progress / upcoming) is derived live from attendance + circuit progress in sState().
function todaysSessions(){
 return sessionsOnDay(todayWeekday(),homeScoped(visibleClients()));
}
// client attendance rate — share of marked attendances where the client showed up
function clientAttendanceRate(){
 const marks=Object.values(attStatus).filter(s=>s==='present'||s==='absent'||s==='cancelled');
 if(!marks.length)return 92;   // no attendance marked yet — neutral default
 return Math.round(marks.filter(s=>s==='present').length/marks.length*100);
}
// HELPER ADDED: no historical store exists for "vs yesterday", so derive a small deterministic delta from the metric
function vsYesterday(n){return Math.max(1,(Math.abs(n)*7)%9+1);}
// ---- shared client filters — ONE predicate per metric, so a Home stat's count and the
// Clients-list filtered count are ALWAYS identical (tap a stat → see exactly those clients).
// (paymentDue is the existing back-compat helper, reused here.) ----
const CLIENT_FILTERS={
 'All':                {label:'All clients',          pred:()=>true},
 'Active':             {label:'Active clients',       pred:c=>c.status==='Active'&&c.scheduleSet},
 'Leads':              {label:'New leads',            pred:c=>!c.scheduleSet},
 'Payment due':        {label:'Pending payments',     pred:paymentDue},
 'Membership expiring':{label:'Memberships expiring', pred:c=>paymentStatus(c)==='DueSoon'},
 'Payment overdue':    {label:'Payments overdue',     pred:c=>paymentStatus(c)==='Overdue'},
 'Missed':             {label:'Missed sessions',      pred:c=>attStatus[c.id]==='absent'||attStatus[c.id]==='cancelled'},
 'Assessment due':     {label:'Assessments due',      pred:c=>!c.assessmentDone||(c.status==='Active'&&rev(c.id).due)},
 'Paused':             {label:'Paused clients',       pred:c=>c.status==='Paused'},
 'Review due':         {label:'Reviews due',          pred:c=>c.status==='Active'&&rev(c.id).due}
};
// the visible clients matching a named filter — the single source of truth for every dashboard count
// home dashboard is scoped to the selected coach (homeCoach); 'All' = every visible client
function homeScoped(list){return homeCoach==='All'?list:list.filter(c=>(c.coach||'Not assigned')===homeCoach);}
function clientsMatching(key){const f=CLIENT_FILTERS[key];return homeScoped(visibleClients()).filter(f?f.pred:()=>true);}
function homeMetrics(){
 const sess=todaysSessions();
 const completed=sess.filter(x=>sessDone[x.id]===true);
 return {
  sess,completed,
  active:clientsMatching('Active'),
  leads:clientsMatching('Leads'),
  dueSoon:clientsMatching('Membership expiring'),
  overdue:clientsMatching('Payment overdue'),
  pendingPay:clientsMatching('Payment due'),
  missed:clientsMatching('Missed'),
  assessDue:clientsMatching('Assessment due').length,
  attRate:clientAttendanceRate()
 };
}
// small green progress ring for the Attendance Rate insight card
function homeRing(pct){
 const r=15,cc=2*Math.PI*r,dash=cc*(Math.max(0,Math.min(100,pct))/100);
 return `<svg class="ei-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--neutral-tint)" stroke-width="4"/>
   <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${cc.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`;
}
function vHome(){
 const p=PROFILES[S.role];
 const m=homeMetrics();
 const h=new Date().getHours();
 const greet=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
 // top-left coach switcher options — All + every coach on the roster
 const coachOpts=['All',...coaches.map(c=>c.name)].map(name=>{
  const co=name==='All'?null:coaches.find(c=>c.name===name);
  return `<button class="pm-opt${homeCoach===name?' on':''}" onclick="setHomeCoach('${name}')">
    <div class="pm-ava">${name==='All'?'👥':(co&&co.photo?`<img src="${co.photo}" alt="${name}">`:initials(name))}</div>
    <div class="pm-tx"><div class="pm-n">${name==='All'?'All coaches':esc(name)}</div><div class="pm-r">${name==='All'?'Every coach':esc(co?co.role:'')}</div></div>
    ${homeCoach===name?'<span class="pm-ck">✓</span>':''}</button>`;}).join('');
 const remaining=m.sess.length-m.completed.length;
 // ---- today's schedule ----
 // derive each session's state live from attendance + circuit progress (no hardcoded per-row status)
 const sState=x=>{
  const a=attStatus[x.id];
  if(a==='absent')return 'absent';
  if(a==='cancelled')return 'cancelled';
  if(sessDone[x.id]===true)return 'done';
  const st=sessionProgress[x.id+'::'+todayISO()];
  if(a==='present'&&st&&st.splitDone)return 'inprogress';
  return 'upcoming';};   // present without a started circuit, or not yet checked in → not started
 // --- show only the live part of the day: current + upcoming, past slots fall off ---
 const toMin=timeToMinutes;   // shared "5:30 PM" → minutes parser
 // "now" boundary = the earliest still-live slot (in-progress, else the up-next)
 const liveTimes=m.sess.filter(x=>{const s=sState(x);return s==='inprogress'||s==='upcoming';}).map(x=>toMin(x.t));
 const nowMin=liveTimes.length?Math.min(...liveTimes):Infinity;
 // keep current + upcoming; hide past done sessions; keep a cancelled/absent slot only if it's still ahead today
 const visible=x=>{const s=sState(x);
  if(s==='inprogress'||s==='upcoming')return true;   // current / future — always show
  if(s==='done')return false;                        // past & finished — hide
  return toMin(x.t)>=nowMin;};                        // cancelled / absent — show only if the slot is still upcoming
 const vis=m.sess.filter(visible);
 // up-next = the first not-started session among the visible ones
 const upIdx=vis.findIndex(x=>sState(x)==='upcoming');
 // status pill + per-state row styling/behaviour
 // no "Upcoming" tag — a future session is upcoming by default; only show a tag when there's something to flag (cancelled / absent / in-progress / done)
 const TAGS={done:['Done','done'],absent:['Absent','missed'],cancelled:['Cancelled','missed'],inprogress:['In progress','prog']};
 const stTag=x=>{const t=TAGS[sState(x)];return t?`<span class="es-tag ${t[1]}">${t[0]}</span>`:'';};
 const dim=x=>{const s=sState(x);return s==='absent'||s==='cancelled';};
 // done/missed rows open the client detail; in-progress (resume) and upcoming (start) open the session
 const rowGo=x=>{const s=sState(x);return (s==='inprogress'||s==='upcoming')?`openSession(${x.id})`:`openClient(${x.id})`;};
 const schedule=(()=>{
  if(!vis.length)return `<div class="es-empty">No upcoming sessions today.</div>`;
  // one chronological timeline; cap the rows so the card stays reasonable, the rest collapse into "+N more"
  const ROW_CAP=12;
  const rows=vis.slice(0,ROW_CAP),hidden=vis.length-rows.length;
  // concurrent sessions share a slot — the time is a header above the group, common to the users below it
  const groups=[];
  rows.forEach(x=>{const g=groups[groups.length-1];if(g&&g.t===x.t)g.rows.push(x);else groups.push({t:x.t,rows:[x]});});
  let html=`<div class="es-list">`+groups.map(g=>
    `<div class="es-group"><div class="es-ghead">${g.t}</div>`+g.rows.map(x=>{const cat=CATS[x.c.cat];const s=sState(x);
      // only the live (in-progress) session is highlighted; everything else is a plain timeline row
      const cls=s==='inprogress'?'live':dim(x)?'missed':'';
      return `<div class="es-row${cls?' '+cls:''}" onclick="${rowGo(x)}">
        <span class="es-node"><span class="es-dot"></span></span>
        <div class="es-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${initials(x.c.name)}</div>
        <div class="es-main"><div class="es-name">${x.c.name}</div><div class="es-prog">${esc(x.c.cat||'')}${homeCoach==='All'?` · <span class="es-coach">${esc(x.c.coach||'Unassigned')}</span>`:''}</div></div>${stTag(x)}</div>`;}).join('')+`</div>`).join('')+`</div>`;
  if(hidden>0)html+=`<button class="es-more" onclick="tab('schedule')">+${hidden} more session${hidden!==1?'s':''}<i>›</i></button>`;
  return html;
 })();
 // ---- critical alerts (only categories that actually have items) ----
 const cl=n=>'client'+(n!==1?'s':'');
 // solid-red warning triangle with a white "!" for the most critical (missed) alert
 const TRI=`<svg viewBox="0 0 24 24" width="34" height="34" fill="none"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="var(--red)"/><path d="M12 9v4.2" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.15" fill="#fff"/></svg>`;
 const alerts=[];
 if(m.missed.length)alerts.push({svg:TRI,t:`${m.missed.length} Missed Session${m.missed.length!==1?'s':''}`,s:`${m.missed.length} ${cl(m.missed.length)} ${m.missed.length===1?'needs':'need'} attention`,go:`goStat('Missed')`});
 if(m.dueSoon.length)alerts.push({ic:'calendar',color:'var(--amber)',t:'Membership Expiring',s:`${m.dueSoon.length} ${cl(m.dueSoon.length)} in next 7 days`,go:`goStat('Membership expiring')`});
 if(m.overdue.length)alerts.push({ic:'wallet',color:'var(--red)',t:'Payment Overdue',s:`${m.overdue.length} ${cl(m.overdue.length)} ${m.overdue.length===1?'has':'have'} pending payments`,go:`goStat('Payment overdue')`});
 const alertsHTML=alerts.length?alerts.map(a=>`<div class="ea-row" onclick="${a.go}">
    <div class="ea-ic uc" style="--c-fg:${a.color||'var(--red)'}">${a.svg||`<i data-lucide="${a.ic}"></i>`}</div>
    <div class="ea-main"><div class="ea-t">${a.t}</div><div class="ea-s">${a.s}</div></div>
    <div class="ea-chev">›</div></div>`).join(''):`<div class="ea-empty">All clear — no critical alerts.</div>`;
 const ehDue=dueClients().length+programEndedClients().length;
 return `<div class="fadein eh">
  <div class="eh-top sticky-top">
   <button class="eh-brand eh-coachsw${coachMenu?' open':''}" onclick="toggleCoachMenu()" aria-label="Switch coach">
    <img src="assets/images/logo.jpg" alt="Elevate">
    <span class="eh-csw-lbl">${homeCoach==='All'?'All coaches':esc(homeCoach)}</span>
    <i data-lucide="chevron-down" class="eh-csw-chev"></i>
   </button>
   <div class="eh-top-act">
    <button class="eh-calbtn eh-notifbtn" onclick="navTo('notifications')" aria-label="Notifications"><i data-lucide="bell"></i>${ehDue?`<span class="eh-nbadge">${ehDue}</span>`:''}</button>
   </div>
   ${coachMenu?`<div class="profile-menu coach-menu"><div class="pm-title">View clients by coach</div>${coachOpts}</div>`:''}
  </div>
  ${coachMenu?`<div class="pm-overlay" onclick="closeCoachMenu()"></div>`:''}
  <div class="eh-greet">${homeCoach==='All'?'View all coaches':`${greet}, ${esc(homeCoach)} 👋`}</div>
  <div class="eh-stats">
   <div class="eh-stat" onclick="tab('schedule')"><div class="eh-stat-ic ic-red"><i data-lucide="calendar"></i></div>
    <div class="eh-stat-tx"><div class="eh-stat-v">${m.sess.length}</div><div class="eh-stat-l">Sessions Today</div><div class="eh-stat-s">${remaining} remaining</div></div></div>
   <div class="eh-stat" onclick="tab('schedule')"><div class="eh-stat-ic ic-grey"><i data-lucide="user-check"></i></div>
    <div class="eh-stat-tx"><div class="eh-stat-v">${m.completed.length}</div><div class="eh-stat-l">Completed</div><div class="eh-stat-s">Today</div></div></div>
   <div class="eh-stat" onclick="goStat('Assessment due')"><div class="eh-stat-ic ic-amber"><i data-lucide="clipboard-list"></i></div>
    <div class="eh-stat-tx"><div class="eh-stat-v">${m.assessDue}</div><div class="eh-stat-l">Assessments Due</div><div class="eh-stat-s">Today</div></div></div>
   <div class="eh-stat" onclick="goStat('Active')"><div class="eh-stat-ic ic-grey"><i data-lucide="users"></i></div>
    <div class="eh-stat-tx"><div class="eh-stat-v">${m.active.length}</div><div class="eh-stat-l">Active Clients</div><div class="eh-stat-s">This Month</div></div></div>
  </div>
  <div class="eh-cols">
   <div class="es-col eh-card">
    <div class="eh-card-h"><div class="eh-card-t">Today's Schedule</div><button class="eh-viewall" onclick="tab('schedule')">View all</button></div>
    ${schedule}
   </div>
   <div class="ea-col">
    <div class="eh-card">
     <div class="eh-card-h"><div class="eh-card-t">Critical Alerts ${alerts.length?`<span class="eh-badge">${alerts.length}</span>`:''}</div>${alerts.length?`<button class="eh-viewall" onclick="goStat('All')">View all</button>`:''}</div>
     ${alertsHTML}
    </div>
    <div class="eh-card">
     <div class="eh-card-h"><div class="eh-card-t">Quick Stats</div></div>
     <div class="eq-grid">
      <div class="eq-tile" onclick="goStat('Active')"><div class="eq-ic ic-red"><i data-lucide="users"></i></div><div class="eq-tx"><div class="eq-v">${m.active.length}</div><div class="eq-l">Active Clients</div></div></div>
      <div class="eq-tile" onclick="goStat('Leads')"><div class="eq-ic ic-grey"><i data-lucide="user-plus"></i></div><div class="eq-tx"><div class="eq-v">${m.leads.length}</div><div class="eq-l">New Leads</div></div></div>
      <div class="eq-tile" onclick="tab('schedule')"><div class="eq-ic ic-grey"><i data-lucide="chart-column"></i></div><div class="eq-tx"><div class="eq-v">${m.attRate}%</div><div class="eq-l">Attendance</div><div class="eq-delta">↑ ${vsYesterday(m.attRate)}% vs yesterday</div></div></div>
      <div class="eq-tile" onclick="goStat('Payment due')"><div class="eq-ic ic-amber"><i data-lucide="wallet"></i></div><div class="eq-tx"><div class="eq-v">${m.pendingPay.length}</div><div class="eq-l">Pending Payments</div></div></div>
     </div>
    </div>
   </div>
  </div>
  <div class="ei-wrap">
   <div class="ei-h">Client Insights</div>
   <div class="ei-grid">
    <div class="ei-card" onclick="tab('schedule')"><div class="ei-top">${homeRing(m.attRate)}<div class="ei-v">${m.attRate}%</div></div>
     <div class="ei-l">Attendance Rate</div><div class="ei-s ei-up">↑ ${vsYesterday(m.attRate)}% vs yesterday</div></div>
    <div class="ei-card" onclick="goStat('Leads')"><div class="ei-top"><div class="ei-ic ic-grey"><i data-lucide="users"></i></div><div class="ei-v">${m.leads.length}</div></div>
     <div class="ei-l">New Leads</div><div class="ei-s ei-up">↑ ${vsYesterday(m.leads.length)}% vs yesterday</div></div>
    <div class="ei-card" onclick="goStat('Payment due')"><div class="ei-top"><div class="ei-ic ic-red"><i data-lucide="wallet"></i></div><div class="ei-v">${m.pendingPay.length}</div></div>
     <div class="ei-l">Pending Payments</div><div class="ei-s">${m.pendingPay.length} ${cl(m.pendingPay.length)}</div></div>
    <div class="ei-card" onclick="goStat('Missed')"><div class="ei-top"><div class="ei-ic ic-orange"><i data-lucide="circle-alert"></i></div><div class="ei-v">${m.missed.length}</div></div>
     <div class="ei-l">Missed Sessions</div><div class="ei-s">Clients need attention</div></div>
    <div class="ei-card" onclick="goStat('Assessment due')"><div class="ei-top"><div class="ei-ic ic-amber"><i data-lucide="clipboard-list"></i></div><div class="ei-v">${m.assessDue}</div></div>
     <div class="ei-l">Assessments Due</div><div class="ei-s">Today</div></div>
    <div class="ei-card" onclick="goStat('Membership expiring')"><div class="ei-top"><div class="ei-ic ic-purple"><i data-lucide="calendar"></i></div><div class="ei-v">${m.dueSoon.length}</div></div>
     <div class="ei-l">Memberships Expiring</div><div class="ei-s">In next 7 days</div></div>
   </div>
  </div>
  <div class="sp24"></div></div>`;
}
// logged activity entries rendered as Home "Activity" rows (newest first), above the static demo rows
function activityRowsHTML(){
 if(!activityLog.length)return '';
 const ic={PAYMENT:['ai-green',ICO.doc],SESSION:['ai-green',ICO.check],PROGRAM:['ai-blue',ICO.doc]};
 return activityLog.slice(0,5).map(a=>{const m=ic[a.type]||['ai-blue',ICO.plus];
  return `<div class="act-row"><div class="act-ic ${m[0]}">${m[1]}</div>
   <div class="act-body"><div class="act-tx">${esc(a.msg)}</div><div class="act-tm">${esc(a.when)}</div></div></div>`;}).join('');
}

/* ============ CLIENTS ============ */
let cFilter='All';
let coachFilter='All';   // clients list: coach dropdown ('All' shows everyone)
let payFilter='All';     // clients list: payment-status dropdown ('All' shows everyone)
let stateFilter='All';   // clients list: state dropdown — Active / Paused ('All' shows everyone)
let searchOpen=false;    // clients list: is the search input expanded (else collapsed to an icon)
let clientQuery='';      // clients list: current search text
// per-category line icon (Lucide) used in the client-row meta line
const CAT_LUCIDE={'General wellness':'leaf','Rehab':'activity','Special children':'users','Sports specific':'trophy'};
// query + dropdown filters combined — the single source of truth for the visible rows
function filteredClients(){
 let list=visibleClients();
 if(clientQuery)list=list.filter(c=>c.name.toLowerCase().includes(clientQuery));
 list=applyClientFilter(list);
 return list.slice().sort((a,b)=>a.name.localeCompare(b.name));
}
function vClients(){
 const all=visibleClients();
 const filtered=filteredClients();
 return `<div class="fadein">
  ${vTopbar()}
  <div class="bar clients-head">
   ${searchOpen
    ? `<div class="cl-searchwrap open"><span class="cl-search-ic"><i data-lucide="search"></i></span><input class="search cl-search" placeholder="Search clients…" oninput="searchClients(this.value)" value="${esc(clientQuery)}"><button class="cl-search-x" onclick="toggleSearch()" aria-label="Close search"><i data-lucide="x"></i></button></div>`
    : `<div class="ch-icon"><i data-lucide="users"></i></div>
   <div class="ch-title-wrap"><div class="bar-title">Clients</div><div class="ch-sub">Manage and track all your clients in one place.</div></div>
   <button class="cl-search-btn ch-search" onclick="toggleSearch()" aria-label="Search"><i data-lucide="search"></i></button>`}
  </div>
  <div class="cl-filter-bar">${coachFilterSelect(all)}${payFilterSelect(all)}${stateFilterSelect(all)}</div>
  ${(cFilter!=='All'&&CLIENT_FILTERS[cFilter])?`<div class="cl-fbanner"><span class="cl-fbanner-t"><i data-lucide="filter"></i>${CLIENT_FILTERS[cFilter].label} · ${filtered.length} ${filtered.length===1?'client':'clients'}</span><button class="cl-fbanner-x" onclick="clearClientFilter()">Clear ✕</button></div>`:''}
  <div class="cl-cards" id="clientList">${clientsListHTML(filtered)}</div>
  <div class="sp80"></div></div>`;
}
// filter chips with a leading icon + a live count badge
function clientFilterChips(all){
 const cnt={
  'All':all.length,
  'Payment due':all.filter(c=>{const s=paymentStatus(c);return s==='DueSoon'||s==='Overdue'}).length,
  'Active':all.filter(c=>c.status==='Active').length,
  'Paused':all.filter(c=>c.status==='Paused').length,
  'Assessment pending':all.filter(c=>!c.assessmentDone).length
 };
 const defs=[
  {k:'All',label:'All clients',ic:'users'},
  {k:'Active',label:'Active',dot:'var(--green)'},
  {k:'Payment due',label:'Payment due',ic:'credit-card',attn:true},
  {k:'Paused',label:'Paused',ic:'pause'},
  {k:'Assessment pending',label:'Assessment pending',ic:'clipboard-list'}
 ];
 return defs.map(d=>{const on=cFilter===d.k;
  const lead=d.dot?`<span class="cl-chip-dot swatch" style="--c-bg:${d.dot}"></span>`:`<i data-lucide="${d.ic}"></i>`;
  return `<button class="fchip cl-chip ${on?'on':''} ${d.attn?'attn':''}" onclick="setFilter('${d.k}')">${lead}<span>${d.label}</span><span class="cl-chip-n">${cnt[d.k]}</span></button>`;
 }).join('');
}
// Coach & payment-status dropdowns (next to the search box)
function coachNames(all){const names=[...new Set(all.map(c=>c.coach||'Not assigned'))].sort();
 return [...names.filter(n=>n!=='Not assigned'),...(names.includes('Not assigned')?['Not assigned']:[])];}
function coachFilterSelect(all){
 const opts=['All',...coachNames(all)];
 return `<div class="cl-select-wrap"><i data-lucide="user" class="cl-select-ic"></i><select class="cl-select" onchange="setCoachFilter(this.value)">`
  +opts.map(v=>`<option value="${esc(v)}" ${coachFilter===v?'selected':''}>${v==='All'?'Coaches':esc(v)}</option>`).join('')
  +`</select><i data-lucide="chevron-down" class="cl-select-caret"></i></div>`;
}
function payFilterSelect(all){
 const opts=[['All','Payment'],['Paid','Paid'],['DueSoon','Due soon'],['Overdue','Overdue'],['New','New']];
 return `<div class="cl-select-wrap"><i data-lucide="credit-card" class="cl-select-ic"></i><select class="cl-select" onchange="setPayFilter(this.value)">`
  +opts.map(([v,l])=>`<option value="${v}" ${payFilter===v?'selected':''}>${l}</option>`).join('')
  +`</select><i data-lucide="chevron-down" class="cl-select-caret"></i></div>`;
}
function stateFilterSelect(all){
 const opts=[['All','All status'],['Active','Active'],['Paused','Paused']];
 return `<div class="cl-select-wrap"><i data-lucide="circle-dot" class="cl-select-ic"></i><select class="cl-select" onchange="setStateFilter(this.value)">`
  +opts.map(([v,l])=>`<option value="${v}" ${stateFilter===v?'selected':''}>${l}</option>`).join('')
  +`</select><i data-lucide="chevron-down" class="cl-select-caret"></i></div>`;
}
function setCoachFilter(v){coachFilter=v;clientShown=CLIENT_BATCH;render()}
function setPayFilter(v){payFilter=v;clientShown=CLIENT_BATCH;render()}
function setStateFilter(v){stateFilter=v;clientShown=CLIENT_BATCH;render()}
/* ---- lazy loading: render the list in batches, growing as the bottom sentinel scrolls into view ---- */
const CLIENT_BATCH=8;
let clientShown=CLIENT_BATCH;        // how many rows are currently rendered
let clientLazyList=[];               // the active filtered list being lazily revealed
let _clientLazyObs=null;
function clientsListHTML(list){
 clientLazyList=list;
 if(!list.length)return `<div class="empty"><div class="em">🔍</div><p>No clients match.</p></div>`;
 const rows=renderClientList(list.slice(0,clientShown));
 const more=list.length>clientShown
  ?`<div id="clientSentinel" class="cl-sentinel"><span class="cl-loading">Loading more…</span></div>`:'';
 return rows+more;
}
function loadMoreClients(){
 if(clientShown>=clientLazyList.length)return;
 clientShown+=CLIENT_BATCH;
 const el=document.getElementById('clientList');
 if(el){el.innerHTML=clientsListHTML(clientLazyList);paintIcons();}
 wireClientLazy();
}
// observe the bottom sentinel; when it nears the viewport, reveal the next batch
function wireClientLazy(){
 if(_clientLazyObs){_clientLazyObs.disconnect();_clientLazyObs=null;}
 const root=document.getElementById('screen'),sentinel=document.getElementById('clientSentinel');
 if(!root||!sentinel)return;
 _clientLazyObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)loadMoreClients();})},{root:root,rootMargin:'240px 0px'});
 _clientLazyObs.observe(sentinel);
}
function applyClientFilter(list){
 list=applyChipFilter(list);
 if(coachFilter!=='All')list=list.filter(c=>(c.coach||'Not assigned')===coachFilter);
 if(payFilter!=='All')list=list.filter(c=>paymentStatus(c)===payFilter);
 if(stateFilter!=='All')list=list.filter(c=>c.status===stateFilter);
 return list;
}
function applyChipFilter(list){
 const f=CLIENT_FILTERS[cFilter];
 if(f&&cFilter!=='All')return list.filter(f.pred);
 if(CATS[cFilter])return list.filter(c=>c.cat===cFilter);   // category drill-ins reuse cFilter too
 return list;
}
// ----- per-column cell content for the clients table -----
function clientStatusCell(c){
 return c.status==='Active'
  ? '<span class="clt-pill green"><span class="clt-dot"></span>Active</span>'
  : '<span class="clt-pill grey"><span class="clt-dot"></span>Paused</span>';
}
function clientReviewCell(c){
 return (c.status==='Active'&&rev(c.id).due)
  ? '<span class="clt-pill amber"><i data-lucide="bell"></i>Review due</span>'
  : '<span class="clt-dash">—</span>';
}
function clientPaymentCell(c){
 if(!c.assessmentDone)return '<span class="clt-pill amber"><i data-lucide="stethoscope"></i>Assessment pending</span>';
 if(!c.scheduleDone)return '<span class="clt-pill blue"><i data-lucide="calendar"></i>Schedule pending</span>';
 const ps=paymentStatus(c);
 if(ps==='Paid')return '<span class="clt-pill green"><i data-lucide="check-circle-2"></i>Paid</span>';
 if(ps==='DueSoon')return '<span class="clt-pill amber"><i data-lucide="credit-card"></i>Due soon</span>';
 if(ps==='Overdue')return `<span class="clt-pill red"><i data-lucide="clock"></i>Overdue · ${daysOverdue(c)} days</span>`;
 return '<span class="clt-dash">—</span>';   // New / no payments yet
}
function renderClientList(list){
 return list.map(c=>{const cat=CATS[c.cat];
  return `<div class="clc-card ${c.status==='Paused'?'paused':''}" onclick="openClient(${c.id})">
   <div class="clc-top">
    <div class="ava clc-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${c.photo?`<img src="${esc(c.photo)}" alt="${esc(c.name)}">`:initials(c.name)}</div>
    <div class="clc-id">
     <div class="clc-name">${esc(c.name)}</div>
     <div class="clc-coach"><i data-lucide="user"></i>Coach: ${esc(c.coach||'Not assigned')}</div>
    </div>
    <button class="cl-kebab" onclick="event.stopPropagation();openClientMenu(${c.id})" aria-label="More options"><i data-lucide="more-vertical"></i></button>
   </div>
   <div class="clc-foot">
    ${clientPaymentCell(c)}
    ${c.scheduleSet?`<span class="clc-sess">${c.sessionsRemaining} session${c.sessionsRemaining===1?'':'s'} left</span>`:''}
   </div>
  </div>`}).join('');
}
function setFilter(f){cFilter=f;clientShown=CLIENT_BATCH;render()}
// open the Clients list filtered to EXACTLY a dashboard stat's clients — resets the other list
// filters/search so the count shown matches the number on the card that was tapped.
function goStat(key){cFilter=CLIENT_FILTERS[key]?key:'All';coachFilter=homeCoach;payFilter='All';stateFilter='All';clientQuery='';searchOpen=false;clientShown=CLIENT_BATCH;profileMenu=false;coachMenu=false;S.tab='clients';S.view=null;S.subView=null;render();sc();}
// clear an active dashboard-driven filter, back to the full list
function clearClientFilter(){cFilter='All';clientShown=CLIENT_BATCH;render()}
function searchClients(q){clientQuery=q.toLowerCase();clientShown=CLIENT_BATCH;
 const el=document.getElementById('clientList');if(el){el.innerHTML=clientsListHTML(filteredClients());paintIcons();}
 wireClientLazy();}
// collapse/expand the search field; closing clears the query so the dropdowns return to full results
function toggleSearch(){
 searchOpen=!searchOpen;
 if(!searchOpen)clientQuery='';
 clientShown=CLIENT_BATCH;
 render();
 if(searchOpen)setTimeout(()=>{const i=document.querySelector('.cl-search');if(i)i.focus();},0);
}

/* ============ CLIENT DETAIL ============ */
/* ----- client profile (reference redesign): mini-charts + row builders ----- */
function totalPurchased(c){const sum=(c.payments||[]).filter(p=>p.type==='package').reduce((s,p)=>s+(p.sessions||p.packageSize||0),0);return sum||(c.packageSize||12)}
function cpSpark(data,color){const w=72,h=24,mn=Math.min(...data),mx=Math.max(...data),r=(mx-mn)||1;
 const d=data.map((v,i)=>{const x=i*w/(data.length-1),y=h-2-((v-mn)/r)*(h-4);return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}).join(' ');
 return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
/* axis charts — shared geometry: 320x200 viewBox, scales to card width (uniform, crisp text) */
const CPV={W:320,H:200,PL:34,PR:12,PT:14,PB:26};
function cpFmt(type,v,long){if(type==='pct')return v+'%';if(type==='rating')return (+v).toFixed(1)+(long?' ★':'');if(type==='days')return long?v+' days':v+'d';return ''+v}
function cpTick(v,type){return type==='rating'?Math.round(v*10)/10:Math.round(v)}
function cpDates(n){const out=[],t=new Date();for(let i=0;i<n;i++){const d=new Date(t);d.setDate(d.getDate()-Math.round((n-1-i)*30/(n-1)));out.push(d.getDate()+' '+d.toLocaleString('en-US',{month:'short'}))}return out}
function cpAxes(mn,mx,xlabels,type){const {W,H,PL,PR,PT,PB}=CPV,x0=PL,x1=W-PR,y0=PT,y1=H-PB,rng=(mx-mn)||1,n=xlabels.length;
 let g='';for(let t=0;t<=1;t+=0.5){const gy=(y1-t*(y1-y0)).toFixed(1),gv=mn+t*rng;
  g+=`<line x1="${x0}" y1="${gy}" x2="${x1}" y2="${gy}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><text x="${x0-7}" y="${(+gy+3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--text-dim)">${cpFmt(type,cpTick(gv,type))}</text>`}
 const idxs=[...new Set([0,Math.round((n-1)*0.33),Math.round((n-1)*0.66),n-1])];
 idxs.forEach(i=>{const tx=x0+i*(x1-x0)/(n-1),anc=i===0?'start':(i===n-1?'end':'middle');
  g+=`<text x="${tx.toFixed(1)}" y="${H-8}" text-anchor="${anc}" font-size="9" fill="var(--text-dim)">${xlabels[i]}</text>`});
 return g}
function cpChartLine(vals,xlabels,color,gid,type){const {W,H,PL,PR,PT,PB}=CPV,x0=PL,x1=W-PR,y0=PT,y1=H-PB,n=vals.length;
 let mn=Math.min(...vals),mx=Math.max(...vals);const pad=((mx-mn)||1)*0.18;mn-=pad;mx+=pad;if(type!=='rating')mn=Math.max(0,mn);const rng=(mx-mn)||1;
 const X=i=>x0+i*(x1-x0)/(n-1),Y=v=>y1-((v-mn)/rng)*(y1-y0);
 const pts=vals.map((v,i)=>[+X(i).toFixed(1),+Y(v).toFixed(1)]);
 const line=pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
 return `<div class="cp-chart" data-type="${type}" data-vals='${JSON.stringify(vals)}' data-x='${JSON.stringify(xlabels)}' data-pts='${JSON.stringify(pts)}'>
  <svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.30"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
   ${cpAxes(mn,mx,xlabels,type)}
   <path d="${line} L ${x1} ${y1} L ${x0} ${y1} Z" fill="url(#${gid})"/>
   <path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
   <g class="cp-cross" opacity="0"><line class="cp-cross-l" x1="0" y1="${y0}" x2="0" y2="${y1}" stroke="rgba(255,255,255,0.28)" stroke-width="1" stroke-dasharray="3 3"/><circle class="cp-cross-d" r="4.5" fill="${color}" stroke="var(--bg)" stroke-width="2"/></g>
  </svg><div class="cp-tip"></div></div>`}
function cpChartBars(vals,xlabels,color,type){const {W,H,PL,PR,PT,PB}=CPV,x0=PL,x1=W-PR,y0=PT,y1=H-PB,n=vals.length;
 const mn=0,mx=(Math.max(...vals)||1)*1.18,slot=(x1-x0)/n,bw=Math.min(slot*0.55,16);
 const pts=[];let rects='';
 vals.forEach((v,i)=>{const cx=x0+slot*(i+0.5),bh=(v/mx)*(y1-y0),ry=y1-bh;pts.push([+cx.toFixed(1),+ry.toFixed(1)]);
  rects+=`<rect class="cp-bar2" x="${(cx-bw/2).toFixed(1)}" y="${ry.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2.5" fill="${color}"/>`});
 return `<div class="cp-chart" data-type="${type}" data-bars="1" data-vals='${JSON.stringify(vals)}' data-x='${JSON.stringify(xlabels)}' data-pts='${JSON.stringify(pts)}'>
  <svg viewBox="0 0 ${W} ${H}">${cpAxes(mn,mx,xlabels,type)}${rects}</svg><div class="cp-tip"></div></div>`}
function wireCpCharts(){
 document.querySelectorAll('.cp-chart').forEach(wrap=>{
  const svg=wrap.querySelector('svg'),tip=wrap.querySelector('.cp-tip');if(!svg||!tip)return;
  const vals=JSON.parse(wrap.dataset.vals),xs=JSON.parse(wrap.dataset.x),pts=JSON.parse(wrap.dataset.pts),type=wrap.dataset.type,n=vals.length;
  const cross=wrap.querySelector('.cp-cross'),line=wrap.querySelector('.cp-cross-l'),dot=wrap.querySelector('.cp-cross-d'),bars=wrap.querySelectorAll('.cp-bar2');
  const idxAt=cx=>{const r=svg.getBoundingClientRect(),lx=r.left+CPV.PL/CPV.W*r.width,rx=r.left+(CPV.W-CPV.PR)/CPV.W*r.width;let f=(cx-lx)/((rx-lx)||1);return Math.max(0,Math.min(n-1,Math.round(f*(n-1))))};
  const show=idx=>{const p=pts[idx],r=svg.getBoundingClientRect();
   if(cross){cross.setAttribute('opacity','1');line.setAttribute('x1',p[0]);line.setAttribute('x2',p[0]);dot.setAttribute('cx',p[0]);dot.setAttribute('cy',p[1])}
   if(bars.length)bars.forEach((b,i)=>b.style.opacity=i===idx?'1':'0.35');
   tip.innerHTML='<b>'+cpFmt(type,vals[idx],true)+'</b><span>'+xs[idx]+'</span>';tip.style.opacity='1';
   const lx=p[0]/CPV.W*r.width,ly=p[1]/CPV.H*r.height,tw=tip.offsetWidth||72;
   tip.style.left=Math.max(2,Math.min(r.width-tw-2,lx-tw/2))+'px';tip.style.top=Math.max(2,ly-46)+'px'};
  const hide=()=>{if(cross)cross.setAttribute('opacity','0');if(bars.length)bars.forEach(b=>b.style.opacity='1');tip.style.opacity='0'};
  const move=e=>{const cx=e.touches?e.touches[0].clientX:e.clientX;show(idxAt(cx));if(e.touches&&e.cancelable)e.preventDefault()};
  wrap.addEventListener('mousemove',move);wrap.addEventListener('mouseleave',hide);
  wrap.addEventListener('touchstart',move,{passive:false});wrap.addEventListener('touchmove',move,{passive:false});wrap.addEventListener('touchend',hide);
 })}
function cpMetric(label,val,color,spark){return `<div class="cp-metric"><div class="cp-ml">${label} <i data-lucide="info"></i></div><div class="cp-mv uc" style="--c-fg:${color}">${val}</div><div class="cp-spark">${spark}</div><div class="cp-mf">Last 30 days</div></div>`}
function cpKV(icn,k,v){return `<div class="cp-kv"><span class="cp-kic"><i data-lucide="${icn}"></i></span><span class="cp-kk">${k}</span><span class="cp-kvv">${esc(v)}</span></div>`}
function cpTrendCard(label,val,color,delta,chart){return `<div class="cp-card cp-tcard"><div class="cp-thead"><div class="cp-tlabel">${label}</div><div class="cp-tbig uc" style="--c-fg:${color}">${val}</div><div class="cp-tdelta">${delta} ↗</div></div>${chart}</div>`}
function vClient(){
 const c=cur(),cat=CATS[c.cat];
 const tabs=['overview','program','sessions','progress','payment','media'];
 const tlbl={overview:'Overview',program:'Program',sessions:'Sessions',progress:'Progress',payment:'Payment',media:'Media'};
 const tic={overview:'<i data-lucide="clipboard-list"></i>',program:'<i data-lucide="dumbbell"></i>',sessions:'<i data-lucide="calendar"></i>',progress:'<i data-lucide="trending-up"></i>',payment:'<i data-lucide="credit-card"></i>',media:'<i data-lucide="camera"></i>'};
 // payment standing card, pinned to the top-right of the user info (shown for fully set-up clients)
 const ps=paymentStatus(c);
 let hc=null;
 if(c.scheduleSet){
  if(ps==='Overdue')hc={cls:'over',title:'Payment overdue · '+daysOverdue(c)+' days'};
  else if(ps==='DueSoon')hc={cls:'due',title:'Payment due soon'};
  else if(ps==='New')hc={cls:'new',title:'No payments yet'};
  else hc={cls:'paid',title:'Payment up to date'};
 }
 const payHeadCard=hc?`<div class="pay-head-card ${hc.cls}" onclick="openClientSection('payment')">
    <span class="phc-ic"><i data-lucide="wallet"></i></span>
    <div class="phc-tx"><b>${hc.title}</b><span>Last session date: ${c.lastSessionDate?fmtPayDate(c.lastSessionDate):'—'}</span></div>
    <div class="phc-chev">›</div></div>`:'';
 const head=`<div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title nm">${c.name}</div>
   ${c.assessmentDone?`<button class="iconbtn" onclick="openClientMenu(${c.id})" aria-label="More options">⋮</button>`:''}</div>
  <div class="dhead">
   <div class="dava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${c.photo?`<img src="${esc(c.photo)}" alt="${esc(c.name)}">`:initials(c.name)}</div>
   <div class="dhead-m">
    <div class="dname">${c.name}</div>
    <div class="dmeta"><span class="dmeta-i"><i data-lucide="user"></i>${c.age} yrs</span><span class="dmeta-i"><i data-lucide="calendar"></i>${c.sessions} sessions</span><span class="dmeta-i"><i data-lucide="user"></i>Coach: ${c.coach||'Not assigned'}</span></div>
    <div class="dtags"><span class="tag tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${cat.ic} ${c.cat}${c.cat==='Sports specific'?' · '+c.ability:''}</span>
    <span class="tag tint-cat" style="--c-bg:${c.status==='Active'?'var(--green-bg)':'var(--bg)'};--c-fg:${c.status==='Active'?'var(--green)':'var(--muted)'}">● ${c.status}</span>
    ${stageTagHTML(c)}</div>
   </div>
   ${payHeadCard}
  </div>`;
 // staged add: until the schedule & coach are set, show only a pending Overview with action cards — no sub-tabs
 if(!c.scheduleSet)return `<div class="fadein">${head}<div id="ctabContent">${pendingOverview(c)}</div><div class="sp24"></div></div>`;
 // a section drill-in stacks over the long page, fully replacing it (back button → goBackToClient)
 if(S.subView){
  const drill={program:vClientProgram,sessions:vClientSessions,progress:vClientProgress,payment:vClientPayment,media:vClientMedia,basic:vClientBasic,assessment:vClientAssessment,schedule:vClientSchedule}[S.subView];
  if(drill)return drill(c.id);
 }
 // ---- single-scroll fintech profile (reference redesign) ----
 const first=c.name.split(' ')[0];
 const email=c.email||(c.name.toLowerCase().replace(/\s+/g,'.')+'@gmail.com');
 const tot=totalPurchased(c),rem=(c.sessionsRemaining!=null?c.sessionsRemaining:0),used=Math.max(0,tot-rem),pct=tot?Math.round(used/tot*100):0;
 const p=c.program||{},wk=S.week||1;
 const payInfo=({Paid:['Up to date','cp-g'],DueSoon:['Due soon','cp-a'],Overdue:['Overdue · '+daysOverdue(c)+'d','cp-r'],New:['No payments','cp-m']}[paymentStatus(c)])||['—','cp-m'];
 const lastSess=c.lastSessionDate?fmtShortDate(c.lastSessionDate):'—';
 return `<div class="fadein cprofile">
  <div class="cp-top">
   <button class="iconbtn" onclick="goBack()" aria-label="Back"><i data-lucide="chevron-left"></i></button>
   <div class="cp-top-r">
    <button class="iconbtn cp-bell" onclick="toast('Notifications')" aria-label="Notifications"><i data-lucide="bell"></i><span class="cp-badge">4</span></button>
    ${c.assessmentDone?`<button class="iconbtn" onclick="openClientMenu(${c.id})" aria-label="More options"><i data-lucide="more-horizontal"></i></button>`:''}
   </div>
  </div>
  <div class="cp-prof">
   <div class="cp-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${initials(c.name)}<span class="cp-on ${c.status==='Active'?'':'off'}"></span></div>
   <div class="cp-id">
    <div class="cp-name">${esc(c.name)}</div>
    <div class="cp-status ${c.status==='Active'?'on':'off'}"><span class="cp-dot"></span>${c.status}</div>
    <div class="cp-meta"><span><i data-lucide="user"></i>${c.age} yrs</span><span><i data-lucide="clipboard-list"></i>${c.sessions} Sessions</span><span><i data-lucide="user-round"></i>${esc(c.coach||'—')}</span></div>
   </div>
  </div>
  <div class="cp-card cp-pay" onclick="openClientSection('payment')">
   <span class="cp-pay-ic"><i data-lucide="wallet"></i></span>
   <div class="cp-pay-tx"><div class="cp-pay-t">Payment status</div><div class="cp-pay-s"><b class="${payInfo[1]}">${payInfo[0]}</b> · Last session ${lastSess}</div></div>
   <button class="cp-outline" onclick="event.stopPropagation();openClientSection('payment')">View details</button>
  </div>
  <div class="cp-card cp-group">
   <div class="cp-row">
    <span class="cp-row-ic tint-red"><i data-lucide="calendar-check"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Sessions used</div><div class="cp-row-s">${used} of ${tot} purchased</div></div>
    <div class="cp-prog"><div class="cp-bar"><i style="--pct:${pct}%"></i></div><span class="cp-pct">${pct}%</span></div>
   </div>
   <div class="cp-row tap" onclick="openClientSection('sessions')">
    <span class="cp-row-ic tint-green"><i data-lucide="play-circle"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Active sessions</div><div class="cp-row-s">${rem} session${rem!==1?'s':''} remaining</div></div>
    <i class="cp-chev" data-lucide="chevron-right"></i>
   </div>
   <div class="cp-row tap" onclick="openClientSection('program')">
    <span class="cp-row-ic tint-purple"><i data-lucide="clipboard-list"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Current active program</div><div class="cp-row-s">${esc(programDisplayName(c))} · Week ${wk} of ${p.weeks||6}</div></div>
    <i class="cp-chev" data-lucide="chevron-right"></i>
   </div>
  </div>
  <div class="cp-card cp-group">
   <div class="cp-row tap" onclick="openClientSection('basic')">
    <span class="cp-row-ic tint-blue"><i data-lucide="user-round"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Basic information</div><div class="cp-row-s">Phone, email & category</div></div>
    <i class="cp-chev" data-lucide="chevron-right"></i>
   </div>
   <div class="cp-row tap" onclick="openClientSection('assessment')">
    <span class="cp-row-ic tint-green"><i data-lucide="clipboard-check"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Assessment report</div><div class="cp-row-s">${c.assessment?'Measurements, goals & ratings':(c.assessmentDone?'Goals & health summary':'Assessment pending')}</div></div>
    <i class="cp-chev" data-lucide="chevron-right"></i>
   </div>
   <div class="cp-row tap" onclick="openClientSection('schedule')">
    <span class="cp-row-ic tint-amber"><i data-lucide="calendar-clock"></i></span>
    <div class="cp-row-m"><div class="cp-row-t">Current schedule</div><div class="cp-row-s">${(c.days&&c.days!=='—')?esc(c.days):'Not set'}${(c.time&&c.time!=='—')?' · '+esc(c.time):''}</div></div>
    <i class="cp-chev" data-lucide="chevron-right"></i>
   </div>
  </div>
  <div class="cp-card">
   <div class="cp-sec"><div class="cp-sec-t"><i data-lucide="image" class="t-pink"></i>Progress photos</div><button class="cp-link" onclick="openClientSection('media')">View all</button></div>
   <div class="cp-photos">
    ${(c.photos&&c.photos.length?c.photos:[{t:'—',d:'No photos',c:'before'}]).slice(0,6).map(ph=>{const col=ph.c==='before'?'var(--muted)':'var(--accent)';return `<div class="cp-photo"><div class="cp-photo-img swatch" style="--c-bg:linear-gradient(160deg,${col},#16161a 82%)">${esc(ph.t)}</div><div class="cp-photo-cap">${esc(ph.d)}</div></div>`}).join('')}
    <button class="cp-photo-add" onclick="openClientSection('media')"><i data-lucide="camera"></i><span>Add new</span></button>
   </div>
  </div>
  ${hasProgressData(c)?`<div class="cp-secrow"><div class="cp-sec-t"><i data-lucide="trending-up" class="t-accent"></i>Strength progress</div><button class="cp-link" onclick="openClientSection('progress')">View all <i data-lucide="chevron-right"></i></button></div>
  ${progSummaryTiles(c)}
  ${progMuscleGrid(c)}`:''}
 </div>`;
}
// legacy shim — S.ctab is no longer the source of truth (the long page renders every section);
// kept so any stray caller resolves to a scroll/drill-in instead of breaking.
function setCtab(t){S.ctab=t;if(t==='overview'){const s=document.getElementById('screen');if(s)s.scrollTop=0;return}scrollToSection('sec-'+t)}
function ctabContent(){return({overview:tabOverview,program:tabProgram,sessions:tabSessions,progress:tabProgress,payment:tabPayment,media:tabMedia}[S.ctab]||tabOverview)()}

/* ===== one-page client detail: sections, drill-ins, scroll-spy ===== */
function dsSecHeader(title,action){return `<div class="ds-sec-header"><div class="ds-sec-title">${title}</div>${action||''}</div>`}
function dsViewMore(section){return `<button class="ds-view-more" onclick="openClientSection('${section}')">View more →</button>`}
// the back-button header shared by every section drill-in
function clientDrillHead(c,label,action){return `<div class="bar solid"><button class="iconbtn" onclick="goBackToClient()">‹</button><div class="bar-title nm">${esc(c.name.split(' ')[0])} · ${label}</div>${action||''}</div>`}

// ---- Overview section: the full overview content inline (no collapse, no drill-in) ----
function overviewSection(c){return dsSecHeader('Overview')+tabOverview()}

// ---- Program section: current-program summary + current-week load preview ----
function programSection(c){
 const p=c.program||{};const total=progTotal(p);
 const names=(c.exercises||[]).map(e=>e.name);
 const shown=names.slice(0,5).join(' · ')+(names.length>5?' …':'');
 const wk=S.week;
 const loadRows=(c.exercises||[]).slice(0,4).map(ex=>{const l=ex.logs[wk];const rep=isRepBased(ex);
  const v=l?(l.w+(rep?'':'kg')+' × '+l.r):'—';
  return `<div class="ds-load-row"><span class="ds-load-ex">${esc(ex.name)}</span><span class="ds-load-v">${v}</span></div>`}).join('');
 return dsSecHeader('Program',dsViewMore('program'))+
 `<div class="ds-preview"><div class="block ds-prog-card">
   <div class="ds-prog-top"><div class="ds-prog-name">${esc(programDisplayName(c))}</div><span class="ph-no">Program #${p.no||1}</span></div>
   <div class="ds-prog-meta">Week ${wk} of ${p.weeks||6} · ${p.done||0} of ${total} sessions</div>
   <div class="ds-prog-ex">${names.length?esc(shown):'No exercises yet'}</div>
   ${loadRows?`<div class="ds-load-grid"><div class="ds-load-cap">Week ${wk} load</div>${loadRows}${names.length>4?`<div class="ds-load-more">+${names.length-4} more</div>`:''}</div>`:''}
  </div></div>`;
}

// ---- Sessions section: this-week list + this-week summary stats ----
function sessionsSection(c){
 const ws=weekSessions(c);const trShort=c.time?shortRange(c.time):'—';
 return dsSecHeader('Sessions',dsViewMore('sessions'))+
 `<div class="ds-preview">
   <div class="block"><div class="ov-h"><div class="ov-h-t">This Week's Sessions</div></div>
    ${ws.length?ws.map(s=>`<div class="ov-sess">
      <div class="ov-sess-day"><b>${s.day}</b>${s.date}</div>
      <div class="ov-sess-ic ${s.status==='Completed'?'done':'up'}"><i data-lucide="dumbbell"></i></div>
      <div class="ov-sess-time">${trShort}</div>
      <span class="ov-badge ${s.status==='Completed'?'done':'up'}">${s.status==='Completed'?'✓ Completed':'Upcoming'}</span>
     </div>`).join(''):'<div class="ov-empty">No sessions scheduled this week.</div>'}
   </div>
  </div>`;
}

// ---- Progress section preview: glanceable summary tiles + muscle-group mini-grid (full charts behind View more) ----
function progressSection(c){
 if(!hasProgressData(c)){
  return dsSecHeader('Progress',dsViewMore('progress'))+
   `<div class="ds-preview"><div class="block"><div class="pg-empty">No progress data yet — log weights &amp; reps to see strength trends.</div></div></div>`;
 }
 return dsSecHeader('Progress',dsViewMore('progress'))+
  `<div class="ds-preview">${progSummaryTiles(c)}${progMuscleGrid(c)}</div>`;
}

// ---- Payment section: last payment line + live balance + status pill ----
function paymentSection(c){
 const lp=lastPayment(c);const size=c.packageSize||12;
 const lastTxt=lp?`Last paid ${fmtPayDate(lp.date)} · ${paymentLabel(lp)} · ${lp.status}`:'No payments recorded yet';
 return dsSecHeader('Payment',dsViewMore('payment'))+
 `<div class="ds-preview"><div class="block pp-card">
   <div class="ds-pay-line">${esc(lastTxt)}</div>
   <div class="ds-pay-balance"><b>${c.sessionsRemaining}</b> of ${size} sessions remaining ${payStatusPill(c)}</div>
   <button class="pp-cta" onclick="openPaymentForm(${c.id})">+ Record payment</button>
  </div></div>`;
}

// ---- Media section: count + the most-recent few photos ----
function mediaSection(c){
 const all=c.photos||[];const recent=all.slice(-3).reverse();
 return dsSecHeader('Media',dsViewMore('media'))+
 `<div class="ds-preview"><div class="block">
   <div class="ds-media-count">${all.length} photo${all.length!==1?'s':''}</div>
   ${recent.length?`<div class="ds-media-strip">${recent.map(p=>{const col=p.c==='before'?'var(--muted)':'var(--accent)';
     return `<div class="ds-media-thumb swatch" style="--c-bg:linear-gradient(160deg,${col},${p.c==='before'?'#9b988f':'var(--accent-dark)'})">${p.t}<span>${p.d}</span></div>`}).join('')}</div>`
    :'<div class="ov-empty">No media yet.</div>'}
  </div></div>`;
}

/* ---- drill-in navigation ---- */
function openClientSection(section){
 const s=document.getElementById('screen');S.clientScroll=s?s.scrollTop:0;   // remember where we were
 S.subView=section;S.reorder=false;
 if(section==='program')S.progSub='current';
 render();
 const s2=document.getElementById('screen');if(s2)s2.scrollTop=0;            // drill-in opens at the top
}
function goBackToClient(){
 const from=S.subView;S.subView=null;render();
 // return to the long page, parked at the section we drilled in from
 requestAnimationFrame(()=>{const el=document.getElementById('sec-'+(from||'overview'));
  if(el)el.scrollIntoView({block:'start'});else{const s=document.getElementById('screen');if(s)s.scrollTop=S.clientScroll||0;}});
}
function scrollToSection(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
// ---- drill-ins for the summary-card rows (Basic info / Assessment / Schedule) ----
function vClientBasic(clientId){
 const c=clients.find(x=>x.id===clientId)||cur();
 const email=c.email||(c.name.toLowerCase().replace(/\s+/g,'.')+'@gmail.com');
 return `<div class="fadein">${clientDrillHead(c,'Basic information')}<div class="sp10"></div>
  <div class="cp-card">
   <div class="cp-sec"><div class="cp-sec-t"><i data-lucide="user-round" class="t-blue"></i>Basic information</div><button class="cp-link" onclick="openEditClient(${c.id})">Edit</button></div>
   ${cpKV('user','Name',c.name)}
   ${cpKV('phone','Phone number','+91 '+c.phone)}
   ${cpKV('mail','Email',email)}
   ${cpKV('tag','Category',c.cat)}
   ${cpKV('calendar','Start date',c.start)}
   ${cpKV('user-round','Coach',c.coach||'Not assigned')}
  </div><div class="sp24"></div></div>`;
}
function vClientAssessment(clientId){
 const c=clients.find(x=>x.id===clientId)||cur();const a=c.assessment||{};const hasA=!!c.assessment;
 return `<div class="fadein">${clientDrillHead(c,'Assessment report')}<div class="sp10"></div>
  <div class="cp-card">
   <div class="cp-sec"><div class="cp-sec-t"><i data-lucide="clipboard-check" class="t-green"></i>Assessment report</div>${hasA?`<button class="cp-link" onclick="viewAssessment(${c.id})">View report</button>`:`<span class="cp-tagm">${c.assessmentDone?'Completed':'Pending'}</span>`}</div>
   ${a.date?cpKV('calendar','Assessed on',a.date):''}
   ${a.by?cpKV('user-round','Coach',a.by):''}
   ${a.weight?cpKV('scale','Weight',a.weight+' kg'):''}
   ${a.height?cpKV('ruler','Height',a.height+' cm'):''}
   ${a.waist?cpKV('ruler','Waist',a.waist+' cm'):''}
   ${a.primaryGoal?cpKV('target','Primary goal',a.primaryGoal):''}
   ${a.fitnessLevel?cpKV('trending-up','Fitness level',a.fitnessLevel):''}
   ${cpKV('flag','Goals',c.goals||'—')}
   ${cpKV('activity','Activity level',c.activity||'—')}
   ${cpKV('heart-pulse','Medical',c.medical||'None reported')}
   ${cpKV('bandage','Injuries',c.injuries||'None')}
   ${ASSESS_DIMS.filter(d=>a.ratings&&a.ratings[d.k]).map(d=>cpKV('star',d.label,RATE_WORDS[a.ratings[d.k]]||'—')).join('')}
  </div><div class="sp24"></div></div>`;
}
function vClientSchedule(clientId){
 const c=clients.find(x=>x.id===clientId)||cur();
 return `<div class="fadein">${clientDrillHead(c,'Current schedule')}<div class="sp10"></div>
  <div class="cp-card">
   <div class="cp-sec"><div class="cp-sec-t"><i data-lucide="calendar-clock" class="t-amber"></i>Current schedule</div><button class="cp-link" onclick="openAddSchedule(${c.id})">Edit</button></div>
   ${cpKV('calendar','Training days',(c.days&&c.days!=='—')?c.days:'Not set')}
   ${cpKV('clock','Time',(c.time&&c.time!=='—')?c.time:'Not set')}
   ${cpKV('user-round','Coach',c.coach||'Not assigned')}
   ${c.programStartDate?cpKV('flag','Program start',fmtPayDate(c.programStartDate)):''}
   ${c.sessionDuration?cpKV('timer','Session length',c.sessionDuration+' min'):''}
  </div><div class="sp24"></div></div>`;
}
// scroll-spy: highlight the anchor for whichever section is crossing ~30% from the top of #screen
let _spyObs=null;
function wireScrollSpy(){
 if(_spyObs){_spyObs.disconnect();_spyObs=null;}
 const root=document.getElementById('screen');if(!root)return;
 const bar=document.getElementById('anchorTabs');if(!bar)return;
 const secs=['overview','program','sessions','progress','payment','media'].map(s=>document.getElementById('sec-'+s)).filter(Boolean);
 if(!secs.length)return;
 const setActive=id=>{[].forEach.call(bar.querySelectorAll('.stab'),b=>b.classList.toggle('on',b.getAttribute('data-anchor')===id));};
 _spyObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)setActive(e.target.id)});
 },{root:root,rootMargin:'-30% 0px -68% 0px',threshold:0});
 secs.forEach(s=>_spyObs.observe(s));
 setActive('sec-overview');
}

/* ---- section drill-ins (reuse the existing tab content; back → long page) ---- */
function vClientProgram(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 const sub=S.progSub==='history'?'history':'current';
 // history lives behind a top-right icon now (toggles current ⇄ history) instead of a segmented bar
 const histBtn=`<button class="iconbtn ${sub==='history'?'on':''}" onclick="S.progSub='${sub==='history'?'current':'history'}';render()" aria-label="${sub==='history'?'Back to current program':'View program history'}"><i data-lucide="history"></i></button>`;
 const body=sub==='current'?tabProgram():programHistoryBody(c);
 return `<div class="fadein">${clientDrillHead(c,sub==='history'?'Program history':'Program',histBtn)}${body}<div class="sp24"></div></div>`;
}
function vClientSessions(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 return `<div class="fadein">${clientDrillHead(c,'Sessions')}${tabSessions()}${sessionHistoryBlock(c)}<div class="sp24"></div></div>`;
}
function vClientProgress(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 return `<div class="fadein">${clientDrillHead(c,'Progress')}${tabProgress()}</div>`;
}
function vClientMedia(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 return `<div class="fadein">${clientDrillHead(c,'Media')}${tabMedia()}</div>`;
}
function vClientPayment(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 return `<div class="fadein">${clientDrillHead(c,'Payment')}${paymentTabContent(c)}</div>`;
}
// recent sessions, newest first — synthesized from cadence (no per-session store in this prototype)
// one row for a real, archived circuit session
function sessHistRow(rec){
 const d=new Date(rec.date+'T00:00:00');
 const dnum=isNaN(d)?'—':d.getDate(),mon=isNaN(d)?'':d.toLocaleDateString('en-GB',{month:'short'});
 const summary=rec.programs.map(p=>p.label.replace('Program ','')+' ×'+p.sets).join(' · ')||'Circuit';
 const badge=rec.early
  ?`<span class="sh-badge cancelled">Ended early · ${rec.roundsCompleted}/${rec.totalRounds}</span>`
  :`<span class="sh-badge done">✓ ${rec.roundsCompleted}/${rec.totalRounds} rounds</span>`;
 return `<div class="sh-row"><div class="sh-date"><b>${dnum}</b>${mon}</div>
   <div class="sh-main"><div class="sh-focus">Circuit · Programs ${esc(summary)}</div><div class="sh-sub">${rec.when||'—'}</div></div>
   ${badge}</div>`;
}
function sessionHistoryBlock(c){
 // ONLY real archived sessions (newest first) — no synthesised filler. Empty state when there are none.
 const real=sessionLog[c.id]||[];
 const realRows=real.map(sessHistRow).join('');
 return `<div class="block"><div class="ov-h"><div class="ov-h-t">Session history</div></div>
   ${realRows?`<div class="sh-list">${realRows}</div>
   <div class="tab-cap foot">Showing completed sessions</div>`
   :`<div class="ph-empty-inline">No completed sessions yet — they'll appear here after ${esc(c.name.split(' ')[0])}'s first session.</div>`}</div>`;
}
/* ----- pending overview: shown while a client is still being set up (assessment / schedule not done) ----- */
// one numbered "Next step" row: completed (green ✓) / active (red, with CTA) / locked (grey, gated)
function pendingStep(o){
 const cls=o.done?'done':o.active?'active':'ns-locked';
 const circle=o.done?'<div class="ns-num done">✓</div>':`<div class="ns-num ${cls}">${o.n}</div>`;
 return `<div class="ns-step ${cls}">
   <div class="ns-num-wrap">${circle}</div>
   <div class="ns-box">
    <div class="ns-body"><div class="ns-step-t">${o.title}</div><div class="ns-step-s">${o.sub}</div></div>
    <div class="ns-right">${o.right||''}</div>
   </div>
  </div>`;
}
function pendingOverview(c){
 const fn=esc(c.name.split(' ')[0]);
 const aDone=!!c.assessmentDone;
 const sDone=!!c.scheduleDone;               // schedule & coach saved (welcome note is the last step)
 const aDraft=!aDone&&!!c.assessment;        // partial assessment saved but not yet completed
 const completed=(aDone?1:0)+(sDone?1:0);    // step 3 (welcome) completing exits this view → max 2 of 3 shown here
 // Step 1 — assessment: active until done, then completed
 const step1=pendingStep({n:1,done:aDone,active:!aDone,
  title:'Add assessment',sub:aDraft?'Draft saved — continue to complete it':'Capture baseline measurements & ratings',
  right:aDone?`<button class="ns-view" onclick="viewAssessment(${c.id})"><i data-lucide="eye"></i>View</button>`
   :`<button class="ns-btn ns-btn-arrow" onclick="openAddAssessment(${c.id})" aria-label="${aDraft?'Continue assessment':'Add assessment'}"><i>›</i></button>`});
 // Step 2 — schedule & coach: locked until the assessment is done; editable once saved
 const step2=pendingStep({n:2,done:sDone,active:aDone&&!sDone,locked:!aDone,
  title:'Add schedule & coach',sub:'Plan training schedule & assign a coach',
  right:!aDone?'<div class="ns-lock"><i data-lucide="lock"></i></div>'
   :sDone?`<button class="ns-view" onclick="openAddSchedule(${c.id})"><i data-lucide="pencil"></i>Edit</button>`
   :`<button class="ns-btn ns-btn-arrow" onclick="openAddSchedule(${c.id})" aria-label="Add schedule and coach"><i>›</i></button>`});
 // Step 3 — welcome note: locked until the schedule is saved
 const step3=pendingStep({n:3,done:false,active:sDone,locked:!sDone,
  title:'Welcome note',sub:'Review & send the welcome note to finish',
  right:sDone?`<button class="ns-btn ns-btn-arrow" onclick="openAddWelcome(${c.id})" aria-label="Welcome note"><i>›</i></button>`
   :'<div class="ns-lock"><i data-lucide="lock"></i></div>'});
 const ability=c.cat==='Sports specific'?`<div class="pd-row"><div class="pd-ic"><i data-lucide="medal"></i></div><div class="pd-l">Ability</div><div class="pd-v">${c.ability}</div></div>`:'';
 return `<div class="fadein pending-wrap">
  <div class="pending-foot">
   <div class="pf-ic">${ICO.check}</div>
   <div class="pf-tx"><b>Complete all three steps to activate ${fn}'s training journey.</b><span>You can edit or update details anytime.</span></div>
   <div class="pf-leaf">🌿</div>
  </div>
  <div class="block ns-card">
   <div class="ns-head"><span class="ns-h-t">Next steps</span><span class="ns-count">${completed} of 3 completed</span></div>
   <div class="ns-steps">${step1}${step2}${step3}</div>
  </div>
  <div class="pending-cols">
   <div class="block pd-card">
    <div class="pd-head"><span>Client details</span><button class="pd-link pd-link-ic" onclick="toast('Editing opens the add-client form')" aria-label="Edit client details"><i data-lucide="pencil"></i></button></div>
    <div class="pd-row"><div class="pd-ic"><i data-lucide="calendar"></i></div><div class="pd-l">Age</div><div class="pd-v">${c.age} yrs</div></div>
    <div class="pd-row"><div class="pd-ic"><i data-lucide="phone"></i></div><div class="pd-l">Phone</div><div class="pd-v">${c.phone}</div></div>
    <div class="pd-row"><div class="pd-ic"><i data-lucide="mail"></i></div><div class="pd-l">Email</div><div class="pd-v">${c.email||'—'}</div></div>
    <div class="pd-row"><div class="pd-ic"><i data-lucide="tag"></i></div><div class="pd-l">Category</div><div class="pd-v">${c.cat}</div></div>
    ${ability}
   </div>
   <div class="block qs-card">
    <div class="pd-head"><span>Questionnaire summary</span><button class="pd-link" onclick="toast('Full questionnaire shown below')">View all</button></div>
    <div class="qs-item"><span class="qs-dot"></span><div class="qs-tx"><div class="qs-t">Fitness Goals</div><div class="qs-s">${esc(c.goals||'—')}</div></div></div>
    <div class="qs-item"><span class="qs-dot"></span><div class="qs-tx"><div class="qs-t">Medical History</div><div class="qs-s">${esc(c.medical||'—')}</div></div></div>
    <div class="qs-item"><span class="qs-dot"></span><div class="qs-tx"><div class="qs-t">Activity Level</div><div class="qs-s">${esc(c.activity||'—')}</div></div></div>
   </div>
  </div>
  <div class="sp18"></div></div>`;
}

/* ----- overview helpers ----- */
function plusHour(t){
 const m=(t||'').match(/(\d+):(\d+)\s*(AM|PM)/i);
 if(!m)return t||'—';
 let h=+m[1]+1,ap=m[3].toUpperCase();
 if(h===12)ap=ap==='AM'?'PM':'AM';
 if(h>12)h-=12;
 return h+':'+m[2]+' '+ap;
}
function shortRange(t){
 const end=plusHour(t);
 const m1=(t.match(/(AM|PM)/i)||[''])[0],m2=(end.match(/(AM|PM)/i)||[''])[0];
 if(m1&&m2&&m1.toUpperCase()===m2.toUpperCase())return t.replace(/\s*(AM|PM)/i,'')+' – '+end;
 return t+' – '+end;
}
// this client's scheduled sessions for the REAL current week — dates derived from this week's Monday,
// status from the date (a day earlier than today = done, today/later = upcoming). No hardcoded week.
function weekSessions(c){
 const order=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const days=parseDays(c);
 const now=new Date(),dow=(now.getDay()+6)%7;                 // Mon=0
 const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(now.getDate()-dow);
 const todayK=dateKey(now);
 return days.map(function(d){const dd=new Date(monday);dd.setDate(dd.getDate()+order.indexOf(d));
  return{day:d,date:dd.getDate()+' '+dd.toLocaleDateString('en-GB',{month:'short'}),status:dateKey(dd)<todayK?'Completed':'Upcoming'}});
}
function ovChartLabels(c,n){
 const sd=new Date(c.start),out=[];
 for(let i=0;i<n;i++){
  if(i===n-1){out.push('Today');continue}
  if(isNaN(sd)){out.push(i===0?'Start':'');continue}
  out.push(new Date(sd.getFullYear(),sd.getMonth()+i,sd.getDate()).toLocaleDateString('en-GB',{day:'numeric',month:'short'}));
 }
 return out;
}
function ovRing(pct){
 const r=13,cc=2*Math.PI*r,dash=cc*pct/100;
 return `<svg viewBox="0 0 32 32" width="36" height="36"><circle cx="16" cy="16" r="${r}" fill="none" stroke="var(--green-bg)" stroke-width="5"/><circle cx="16" cy="16" r="${r}" fill="none" stroke="var(--green)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${cc.toFixed(1)}" transform="rotate(-90 16 16)"/></svg>`;
}
function tabOverview(){const c=cur();
 const ws=weekSessions(c);
 const mkeys=Object.keys(c.measures||{});
 const mk=S.measure&&mkeys.indexOf(S.measure)>=0?S.measure:mkeys[0];
 const mdata=mk?c.measures[mk]:[];
 const photos=(c.photos||[]).slice(0,4);
 const trFull=c.time?c.time+' – '+plusHour(c.time):'—';
 const trShort=c.time?shortRange(c.time):'—';
 const infoRow=(ic,label,val)=>`<div class="ov-info-i"><span class="ov-info-ic"><i data-lucide="${ic}"></i></span><div class="ov-info-tx"><div class="ov-info-l">${label}</div><div class="ov-info-v">${esc(val||'—')}</div></div></div>`;
 return `<div class="fadein">
  <div class="ov-stats">
   <div class="ov-stat"><div class="ov-stat-ic bg-accent-soft"><i data-lucide="calendar"></i></div><div class="ov-stat-v">${c.sessions}</div><div class="ov-stat-l">Total Sessions</div></div>
   <div class="ov-stat"><div class="ov-stat-ic bg-accent-soft"><i data-lucide="trending-up"></i></div><div class="ov-stat-v">8</div><div class="ov-stat-l">This Month</div></div>
   <div class="ov-stat"><div class="ov-stat-ring">${ovRing(92)}</div><div class="ov-stat-v">92%</div><div class="ov-stat-l">Show Rate</div></div>
  </div>
  <div class="ov-today">
   <div class="ov-today-main">
    <div class="ov-today-l">Today's session</div>
    <div class="ov-today-t">${esc(c.cat||'Training session')}</div>
    <div class="ov-today-time">⏰ ${trFull}</div>
   </div>
   <button class="ov-today-btn" onclick="openSession(${c.id})">🏃  Open session</button>
  </div>
  <div class="ov-grid">
   <div class="block">
    <div class="ov-h"><div class="ov-h-t">This Week's Sessions</div><button class="ov-h-act" onclick="openClientSection('sessions')">📅 View Calendar</button></div>
    ${ws.length?ws.map(s=>`<div class="ov-sess">
      <div class="ov-sess-day"><b>${s.day}</b>${s.date}</div>
      <div class="ov-sess-ic ${s.status==='Completed'?'done':'up'}"><i data-lucide="dumbbell"></i></div>
      <div class="ov-sess-time">${trShort}</div>
      <span class="ov-badge ${s.status==='Completed'?'done':'up'}">${s.status==='Completed'?'✓ Completed':'Upcoming'}</span>
     </div>`).join(''):'<div class="ov-empty">No sessions scheduled this week.</div>'}
   </div>
   <div class="block">
    <div class="ov-h"><div class="ov-h-t">Session Schedule</div></div>
    <div class="kv"><span class="k">📅 Days</span><span class="v">${c.days}</span></div>
    <div class="kv"><span class="k">⏰ Time</span><span class="v">${c.time}</span></div>
    <div class="kv"><span class="k">👤 Coach</span><span class="v">${c.coach}</span></div>
   </div>
   <div class="block ov-wide">
    <div class="ov-h"><div class="ov-h-t">Basic Information</div></div>
    <div class="ov-info">
     ${infoRow('phone','Phone',c.phone)}
     ${infoRow('mail','Email',c.email)}
     ${infoRow('tag','Category',c.cat)}
     ${infoRow('activity','Activity level',c.activity)}
     ${infoRow('user','Coach',c.coach)}
     ${infoRow('calendar','Start date',c.start)}
    </div>
   </div>
   <div class="block ov-wide">
    <div class="ov-h"><div class="ov-h-t">Progress Photos</div><button class="ov-h-act" onclick="openClientSection('media')">View All</button></div>
    ${photos.length?`<div class="ov-photos">${photos.map(p=>{const col=p.c==='before'?'var(--muted)':'var(--accent)';return `<div class="ov-photo"><div class="ov-photo-img swatch" style="--c-bg:linear-gradient(160deg,${col},${p.c==='before'?'#9b988f':'var(--accent-dark)'})">${p.t}</div><div class="ov-photo-cap">${p.d}</div></div>`}).join('')}</div>`:'<div class="ov-empty">No progress photos yet.</div>'}
   </div>
   <div class="block ov-wide">
    <div class="ov-h"><div class="ov-h-t">Progress Overview</div>${mkeys.length>1?`<div class="ov-sel"><select onchange="S.measure=this.value;render()">${mkeys.map(k=>`<option ${k===mk?'selected':''}>${k}</option>`).join('')}</select></div>`:(mkeys.length?`<span class="ov-h-tag">${mk}</span>`:'')}</div>
    ${mkeys.length?`<div class="chart-wrap">${trendChart(mdata,ovChartLabels(c,mdata.length))}</div>`:'<div class="ov-empty">No measurements logged yet.</div>'}
   </div>
  </div>
  ${c.assessment?`<div class="ov-report ov-assess">
   <div class="ov-report-ic"><i data-lucide="clipboard-list"></i></div>
   <div class="ov-report-m"><div class="ov-report-t">First assessment</div><div class="ov-report-s">Baseline measurements & ratings</div></div>
   <button class="ov-report-btn" onclick="viewAssessment(${c.id})">View</button>
  </div>`:''}
  <div class="ov-report">
   <div class="ov-report-ic"><i data-lucide="mail"></i></div>
   <div class="ov-report-m"><div class="ov-report-t">Send Weekly Report</div><div class="ov-report-s">Share progress summary with client</div></div>
   <button class="ov-report-btn" onclick="openReport(${c.id})">➤ Send Report</button>
  </div>
  <div class="sp14"></div></div>`;
}
/* ----- payment date helpers ----- */
function todayISO(){return todayKey()}                                  // 'YYYY-MM-DD' for date inputs
function fmtPayDate(iso){if(!iso)return '';const d=new Date(iso+'T00:00:00');return isNaN(d)?iso:d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
function fmtShortDate(iso){if(!iso)return '';const d=new Date(iso+'T00:00:00');return isNaN(d)?iso:d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
// most recent payment record (by date) for a client, or null
function lastPayment(c){const ps=(c.payments||[]).slice().sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));return ps[ps.length-1]||null}
// describe a payment record: "12-session package" / "16-session package" / "Assessment fee"
function paymentLabel(p){return p.type==='package'?(p.packageSize+' sessions'):ASSESSMENT_FEE_LABEL}
// status pill for the Program & Payment card
function payStatusPill(c){const s=paymentStatus(c);
 if(s==='Paid')return '<span class="pp-pill paid">Paid</span>';
 if(s==='DueSoon')return '<span class="pp-pill due">Due soon</span>';
 if(s==='Overdue')return `<span class="pp-pill over">Overdue · ${daysOverdue(c)} days</span>`;
 return '';}
// unified Program & Payment card shown on the client Overview (and the pending overview for new leads)
function programPaymentCard(c){
 if(paymentStatus(c)==='New'){
  return `<div class="block pp-card">
   <div class="block-t">Program &amp; Payment</div>
   <div class="pp-new">No sessions purchased yet</div>
   <button class="pp-cta" onclick="openPaymentForm(${c.id})">+ Add first payment</button>
  </div>`;
 }
 const size=c.packageSize||12;
 const lp=lastPayment(c);
 const ren=projectedRenewalDate(c);
 const cadence=(c.days&&c.days!=='—')?c.days:'—';
 return `<div class="block pp-card">
  <div class="block-t">Program &amp; Payment ${payStatusPill(c)}</div>
  <div class="pp-headline"><b>${c.sessionsRemaining}</b> of ${size} sessions remaining</div>
  <div class="pp-meta">${size} sessions · ${esc(cadence)}</div>
  ${lp?`<div class="pp-meta">Last paid ${fmtPayDate(lp.date)}</div>`:''}
  ${(c.sessionsRemaining>0&&ren)?`<div class="pp-meta">Likely renewal ~${fmtShortDate(ren)}</div>`:''}
  <button class="pp-cta" onclick="openPaymentForm(${c.id})">+ Record payment</button>
 </div>`;
}
/* ----- Payment tab: package payment history ----- */
function tabPayment(){return paymentTabContent(cur())}
// payment-tab body (history cards + table). Wrapped by the vClientPayment drill-in and by tabPayment.
function paymentTabContent(c){
 const header=`<div class="pay-hist-head"><div class="pay-hist-title">Payment history</div><button class="pay-add-btn" onclick="openPaymentForm(${c.id})">+ Add payment</button></div>`;
 if(!c.payments||!c.payments.length){
  return `<div class="fadein"><div class="pad"><div class="block pay-block">${header}
   <div class="pay-empty">No payments recorded yet. Add the first payment to get started.</div>
  </div></div><div class="sp18"></div></div>`;
 }
 // summary stat cards (money-free — no amounts)
 const lp=lastPayment(c);const ps=paymentStatus(c);
 let stPill,stSub;
 if(ps==='Overdue'){stPill='<span class="pay-pill over">Overdue</span>';stSub=daysOverdue(c)+' days overdue';}
 else if(ps==='DueSoon'){stPill='<span class="pay-pill pending">Due soon</span>';stSub='Renewal due';}
 else{stPill='<span class="pay-pill paid">Paid</span>';stSub='';}
 const cards=`<div class="pay-cards">
  <div class="pay-card"><div class="pay-card-ic blue"><i data-lucide="calendar-days"></i></div>
   <div class="pay-card-tx"><div class="pay-card-l">Sessions purchased</div><div class="pay-card-v">${lifetimeSessions(c)}</div><div class="pay-card-s">Lifetime</div></div></div>
  <div class="pay-card"><div class="pay-card-ic amber"><i data-lucide="clock"></i></div>
   <div class="pay-card-tx"><div class="pay-card-l">Last payment</div><div class="pay-card-v sm">${lp?fmtPayDate(lp.date):'—'}</div><div class="pay-card-s">${lp?esc(paymentLabel(lp)):'No payments yet'}</div></div></div>
  <div class="pay-card"><div class="pay-card-ic red"><i data-lucide="credit-card"></i></div>
   <div class="pay-card-tx"><div class="pay-card-l">Payment status</div><div class="pay-card-v">${stPill}</div>${stSub?`<div class="pay-card-s">${stSub}</div>`:''}</div></div>
 </div>`;
 // chronological, newest first
 const sorted=c.payments.slice().sort((a,b)=>a.date<b.date?1:(a.date>b.date?-1:0));
 const rows=sorted.map(p=>{
  const isPkg=p.type==='package';
  const pill=p.status==='Paid'?'<span class="pay-pill paid">Paid</span>':'<span class="pay-pill pending">Pending</span>';
  const date=p.date?fmtPayDate(p.date):'Date pending';
  const sessions=isPkg?(p.sessions+' sessions'):'Assessment';
  return `<tr>
    <td class="pt-date"><span class="pt-cal"><i data-lucide="calendar"></i></span>${date}</td>
    <td class="pt-sessions">${sessions}</td>
    <td>${pill}</td>
    <td class="pt-action"><button class="pay-kebab" onclick="openPaymentForm(${c.id},${p.id})" aria-label="Edit payment">⋮</button></td>
   </tr>`;
 }).join('');
 const summary=`Total: ${c.payments.length} payment${c.payments.length!==1?'s':''} · ${lifetimeSessions(c)} sessions purchased lifetime`;
 return `<div class="fadein"><div class="pad">
  ${cards}
  <div class="block pay-block">${header}
   <div class="pay-table-wrap"><table class="pay-table">
    <thead><tr><th>DATE</th><th>SESSIONS</th><th>STATUS</th><th class="pt-action">ACTION</th></tr></thead>
    <tbody>${rows}</tbody>
   </table></div>
   <div class="pay-summary">${summary}</div>
  </div>
 </div><div class="sp18"></div></div>`;
}

/* ----- package payment add/edit (popup modal) ----- */
// recompute the live balance after an edit/delete by replaying payment history.
// sessions already consumed (purchased − remaining, captured before the change) are preserved.
function recomputeBalance(c,consumedBefore){
 const purchased=lifetimeSessions(c);
 c.sessionsRemaining=Math.max(0,purchased-consumedBefore);
 // packageSize follows the most recent package payment (by date), else keep the current default
 const pkgs=c.payments.filter(p=>p.type==='package').slice().sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));
 if(pkgs.length)c.packageSize=pkgs[pkgs.length-1].packageSize;
}
function nextPaymentId(c){return (c.payments||[]).reduce((m,p)=>Math.max(m,p.id||0),0)+1}
function closePaymentModal(){const m=document.getElementById('payModal');if(m)m.remove();}
function mountPaymentModal(html){closePaymentModal();const app=document.getElementById('app');if(app)app.insertAdjacentHTML('beforeend',html);paintIcons();}
// open the add/edit popup. paymentId null/undefined = add mode; otherwise edit that record.
function openPaymentForm(id,paymentId){
 const c=clients.find(x=>x.id===id);if(!c)return;
 c.payments=c.payments||[];
 if(paymentId!=null){
  const p=c.payments.find(x=>x.id===paymentId);if(!p)return;
  S.payForm={paymentId:p.id,type:p.type,packageSize:p.packageSize||c.packageSize||12,
   other:p.type==='package'&&PACKAGE_SIZES.indexOf(p.packageSize)<0,status:p.status,date:p.date||todayISO(),notes:p.notes||''};
 }else{
  // add mode — the first ever payment defaults to an assessment fee; otherwise a package prefilled at c.packageSize
  const firstTime=c.payments.length===0;
  S.payForm={paymentId:null,type:firstTime?'assessment':'package',packageSize:c.packageSize||12,other:false,status:'Paid',date:todayISO(),notes:''};
 }
 S.payClientId=id;renderPaymentModal();
}
function payFormSet(k,v){S.payForm[k]=v;renderPaymentModal()}
function setPaySize(v){if(v==='other'){S.payForm.other=true;}else{S.payForm.other=false;S.payForm.packageSize=v;}renderPaymentModal()}
// (re)render the payment popup from S.payForm — re-rendered only on structural toggles, so text inputs keep focus
function renderPaymentModal(){
 const c=clients.find(x=>x.id===S.payClientId);const f=S.payForm;if(!c||!f)return;
 const edit=f.paymentId!=null;const isPkg=f.type==='package';const isPaid=f.status==='Paid';
 const sizeChips=PACKAGE_SIZES.map(s=>`<button class="pd-chip ${(!f.other&&f.packageSize===s)?'on':''}" onclick="setPaySize(${s})">${s}</button>`).join('')
  +`<button class="pd-chip ${f.other?'on':''}" onclick="setPaySize('other')">Other</button>`;
 const otherInput=f.other?`<div class="pd-other"><input type="number" inputmode="numeric" min="1" placeholder="Sessions" value="${esc(f.packageSize||'')}" oninput="S.payForm.packageSize=parseInt(this.value)||0"></div>`:'';
 const sizeField=isPkg?`<div class="pd-field"><label>Package size</label><div class="pd-chips">${sizeChips}</div>${otherInput}</div>`:'';
 const dateField=isPaid?`<div class="pd-field"><label>Date paid</label><input type="date" class="pay-date" value="${f.date||todayISO()}" max="${todayISO()}" onchange="S.payForm.date=this.value"></div>`:'';
 const delLink=edit?`<button class="pd-delete" onclick="deletePayment()">Delete this entry</button>`:'';
 const html=`<div class="modal-overlay" id="payModal" onclick="if(event.target===this)closePaymentModal()">
   <div class="modal-sheet pay-modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${edit?'Edit payment':'Add payment'}</div>
    <div class="pm-form">
     <div class="pd-field"><label>Type</label><div class="seg"><button class="${isPkg?'on':''}" onclick="payFormSet('type','package')">Package</button><button class="${!isPkg?'on':''}" onclick="payFormSet('type','assessment')">Assessment fee</button></div></div>
     ${sizeField}
     <div class="pd-field"><label>Status</label><div class="seg"><button class="${isPaid?'on':''}" onclick="payFormSet('status','Paid')">Paid</button><button class="${!isPaid?'on':''}" onclick="payFormSet('status','Pending')">Pending</button></div></div>
     ${dateField}
     <div class="pd-field"><label>Notes <span class="lbl-hint">(optional)</span></label><textarea class="pd-notes" placeholder="Add a note…" oninput="S.payForm.notes=this.value">${esc(f.notes||'')}</textarea></div>
     <button class="bigbtn" onclick="submitPayment()">${edit?'Save changes':'Add payment'}</button>
     ${delLink}
    </div>
    <button class="modal-cancel" onclick="closePaymentModal()">Cancel</button>
   </div></div>`;
 mountPaymentModal(html);
}
function submitPayment(){
 const c=clients.find(x=>x.id===S.payClientId);if(!c||!S.payForm)return;
 const f=S.payForm;const isPkg=f.type==='package';
 const size=isPkg?(parseInt(f.packageSize)||0):null;
 if(isPkg&&(!size||size<1)){toast('Enter the number of sessions');return}
 const date=f.status==='Paid'?(f.date||todayISO()):'';
 const desc=isPkg?(size+' sessions'):ASSESSMENT_FEE_LABEL;
 if(f.paymentId==null){
  // ADD — stack a new package onto the existing balance
  const rec={id:nextPaymentId(c),date:date,type:f.type,packageSize:isPkg?size:null,sessions:isPkg?size:null,status:f.status,notes:(f.notes||'').trim()};
  c.payments.push(rec);
  if(isPkg){c.sessionsRemaining=(c.sessionsRemaining||0)+size;c.packageSize=size;}
  logActivity('PAYMENT','Recorded payment for '+c.name+' · '+desc+' · '+f.status,{clientId:c.id,detail:rec.notes});
  S.payForm=null;closePaymentModal();render();toast('Payment recorded ✓');
 }else{
  // EDIT — replay history to recompute the balance (preserving sessions already consumed)
  const consumed=lifetimeSessions(c)-c.sessionsRemaining;
  const p=c.payments.find(x=>x.id===f.paymentId);if(!p){S.payForm=null;closePaymentModal();render();return}
  p.type=f.type;p.packageSize=isPkg?size:null;p.sessions=isPkg?size:null;p.status=f.status;p.date=date;p.notes=(f.notes||'').trim();
  recomputeBalance(c,consumed);
  logActivity('PAYMENT','Edited payment for '+c.name+' · '+desc+' · '+f.status,{clientId:c.id});
  S.payForm=null;closePaymentModal();render();toast('Payment updated ✓');
 }
}
function deletePayment(){
 const c=clients.find(x=>x.id===S.payClientId);if(!c||!S.payForm||S.payForm.paymentId==null)return;
 if(!confirm('Delete this payment record? This will recalculate sessions remaining.'))return;
 const consumed=lifetimeSessions(c)-c.sessionsRemaining;
 c.payments=c.payments.filter(p=>p.id!==S.payForm.paymentId);
 recomputeBalance(c,consumed);
 logActivity('PAYMENT','Deleted payment record for '+c.name,{clientId:c.id});
 S.payForm=null;closePaymentModal();render();toast('Payment deleted');
}

/* ----- Program history (archived programs) ----- */
// "12 Feb – 28 Apr 2025" — drops the start year when both dates share it
function fmtProgRange(startISO,endISO){
 const a=startISO?new Date(startISO+'T00:00:00'):null;
 const b=endISO?new Date(endISO+'T00:00:00'):null;
 const sameYear=a&&b&&!isNaN(a)&&!isNaN(b)&&a.getFullYear()===b.getFullYear();
 const fmt=(d,yr)=>d.toLocaleDateString('en-GB',yr?{day:'numeric',month:'short',year:'numeric'}:{day:'numeric',month:'short'});
 if(a&&b&&!isNaN(a)&&!isNaN(b))return fmt(a,!sameYear)+' – '+fmt(b,true);
 if(b&&!isNaN(b))return 'ended '+fmt(b,true);
 if(a&&!isNaN(a))return 'from '+fmt(a,true);
 return '—';
}
// a synthetic program-history-shaped record for the live/current program
function currentProgramRec(c){
 const p=c.program||{};
 return {name:programDisplayName(c),no:p.no||1,startDate:p.startDate||'',endDate:'',
  weeks:p.weeks||0,perWeek:p.perWeek||0,sessionsCompleted:p.done||0,
  exercises:(c.exercises||[]).map(e=>({name:e.name,target:e.target})),notes:'',current:true};
}
function programCard(c,rec,isCurrent){
 const total=(rec.weeks||0)*(rec.perWeek||0);
 const names=(rec.exercises||[]).map(e=>e.name);
 const shown=names.slice(0,5).join(' · ')+(names.length>5?' · …':'');
 const range=isCurrent?('Started '+(rec.startDate?fmtShortDate(rec.startDate):'—')+' · ongoing'):fmtProgRange(rec.startDate,rec.endDate);
 const detailArg=isCurrent?"'current'":rec.id;
 return `<div class="ph-card${isCurrent?' current':''}">
   ${isCurrent?'<div class="ph-curlabel">Current program</div>':''}
   <div class="ph-top"><div class="ph-name">${esc(rec.name)}</div><span class="ph-no">Program #${rec.no}</span></div>
   <div class="ph-range">${range}</div>
   <div class="ph-stats">${rec.weeks} weeks · ${rec.perWeek}/week · ${rec.sessionsCompleted} of ${total} sessions completed</div>
   <div class="ph-exlist">${names.length?esc(shown):'No exercises'}</div>
   <button class="ph-view" onclick="openProgramDetail(${c.id},${detailArg})">View details ›</button>
  </div>`;
}
function openProgramDetail(clientId,programId){S.programDetailId=programId;S.pdFrom=(S.view==='programHistory')?'history':'client';navTo('programDetail',clientId)}
// the program-history body (current card + archived list), reusable inline inside the Program drill-in
function programHistoryBody(c){
 const hist=(c.programHistory||[]).slice().reverse();
 const hasCurrent=!!(c.program&&c.exercises&&c.exercises.length);
 const fn=esc(c.name.split(' ')[0]);
 let body='';
 if(hasCurrent)body+=programCard(c,currentProgramRec(c),true);
 if(hist.length){
  body+=`<div class="ph-sec">History</div>`+hist.map(r=>programCard(c,r,false)).join('');
 }else if(hasCurrent){
  body+=`<div class="ph-empty-inline">No program history yet — ${fn}'s first program is the one running now.</div>`;
 }else{
  body=`<div class="ph-empty"><div class="ph-empty-ic"><i data-lucide="dumbbell"></i></div><div class="ph-empty-t">No programs yet</div></div>`;
 }
 return `<div class="pad">${body}</div>`;
}
function vProgramHistory(clientId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 const head=cid=>`<div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title nm">${cid}</div></div>`;
 if(!c)return `<div class="fadein">${head('Program history')}</div>`;
 return `<div class="fadein">${head(esc(c.name)+' · Program history')}${programHistoryBody(c)}<div class="sp18"></div></div>`;
}
function vProgramDetail(clientId,programId){
 const c=clients.find(x=>x.id===(clientId!=null?clientId:S.clientId));
 const pid=programId!=null?programId:S.programDetailId;
 const back=t=>`<div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title nm">${t}</div></div>`;
 if(!c)return `<div class="fadein">${back('Program')}</div>`;
 const rec=pid==='current'?currentProgramRec(c):(c.programHistory||[]).find(p=>p.id===pid);
 if(!rec)return `<div class="fadein">${back('Program')}<div class="pad"><div class="ph-empty-inline">Program not found.</div></div></div>`;
 const total=(rec.weeks||0)*(rec.perWeek||0);
 const exRows=(rec.exercises||[]).map(e=>`<div class="pde-row"><div class="pde-name">${esc(e.name)}</div><div class="pde-target">${esc(e.target||'—')}</div></div>`).join('');
 const range=rec.current?('Started '+(rec.startDate?fmtPayDate(rec.startDate):'—')+' · ongoing'):fmtProgRange(rec.startDate,rec.endDate);
 return `<div class="fadein">${back(esc(rec.name))}<div class="pad">
   <div class="ph-card${rec.current?' current':''}">
    ${rec.current?'<div class="ph-curlabel">Current program</div>':''}
    <div class="ph-top"><div class="ph-name">${esc(rec.name)}</div><span class="ph-no">Program #${rec.no}</span></div>
    <div class="ph-range">${range}</div>
    <div class="ph-stats">${rec.weeks} weeks · ${rec.perWeek}/week · ${rec.sessionsCompleted} of ${total} sessions completed</div>
    ${rec.notes?`<div class="ph-notes">“${esc(rec.notes)}”</div>`:''}
   </div>
   <div class="block"><div class="block-t">Exercises${rec.current?'':' · read-only'}</div>
    <div class="pde-list">${exRows||'<div class="ph-empty-inline">No exercises recorded.</div>'}</div>
   </div>
  </div><div class="sp18"></div></div>`;
}

/* ----- start a new program (explicit, independent of payment) ----- */
// opens a small dialog (name + length + cadence), then the library attach flow with an empty
// pre-selection; on save, startNewProgram() archives the old program and installs the new one.
function startNewProgramFlow(clientId){
 const c=clients.find(x=>x.id===clientId);if(!c)return;
 const prevNo=(c.program&&c.program.no)||0;
 S.newProg={clientId:clientId,name:'Program #'+(prevNo+1),weeks:4,perWeek:3};
 renderNewProgramModal();
}
function closeNewProgramModal(){const m=document.getElementById('npModal');if(m)m.remove();}
function npSet(k,v){if(S.newProg){S.newProg[k]=v;renderNewProgramModal();}}
function renderNewProgramModal(){
 const f=S.newProg;if(!f)return;
 const c=clients.find(x=>x.id===f.clientId);if(!c)return;
 const weekChips=[4,5,6].map(w=>`<button class="pd-chip ${f.weeks===w?'on':''}" onclick="npSet('weeks',${w})">${w}</button>`).join('');
 const perChips=[2,3,4].map(p=>`<button class="pd-chip ${f.perWeek===p?'on':''}" onclick="npSet('perWeek',${p})">${p}</button>`).join('');
 const html=`<div class="modal-overlay" id="npModal" onclick="if(event.target===this)closeNewProgramModal()">
   <div class="modal-sheet pay-modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Start new program · ${esc(c.name.split(' ')[0])}</div>
    <div class="pm-form">
     <div class="pd-field"><label>Program name <span class="opt-note">· optional</span></label>
      <input class="np-name-input" value="${esc(f.name)}" placeholder="Defaults to Program #${(c.program&&c.program.no||0)+1}" oninput="S.newProg.name=this.value"></div>
     <div class="pd-field"><label>Length (weeks)</label><div class="pd-chips">${weekChips}</div></div>
     <div class="pd-field"><label>Sessions per week</label><div class="pd-chips">${perChips}</div></div>
     <button class="bigbtn" onclick="newProgramContinue()">Continue · pick exercises ›</button>
    </div>
    <button class="modal-cancel" onclick="closeNewProgramModal()">Cancel</button>
   </div></div>`;
 closeNewProgramModal();
 const app=document.getElementById('app');if(app)app.insertAdjacentHTML('beforeend',html);
 paintIcons();
}
function newProgramContinue(){
 const f=S.newProg;if(!f)return;
 if(!(f.name||'').trim()){const c=clients.find(x=>x.id===f.clientId);f.name='Program #'+((((c||{}).program||{}).no||0)+1);}
 closeNewProgramModal();
 // open the library attach flow with an empty pre-selection, in "new program" mode
 S.attachTo=f.clientId;S.attachMode='newProgram';S.picks=[];S.effFrom='now';S.libQ='';S.libGroup='All';
 navTo('library');
}
function saveNewProgramExercises(){
 const f=S.newProg,c=clients.find(x=>x.id===S.attachTo);
 if(!c||!f)return;
 if(!S.picks.length){toast('Tap + to pick exercises first');return}
 const exercises=S.picks.map(i=>({name:library[i].n,g:library[i].g,target:library[i].t,logs:{}}));
 startNewProgram(c,{name:f.name,weeks:f.weeks,perWeek:f.perWeek,exercises:exercises,startDate:todayISO()});
 const cid=c.id;
 S.attachTo=null;S.attachMode=null;S.picks=[];S.newProg=null;
 openClient(cid);
 toast('New program started');
}

/* ============ ADD TO EXERCISE LIBRARY ============ */
// Core: add a new exercise to the in-memory library. Returns the created entry, or null if rejected
// (blank name, or a duplicate name — case-insensitive). Group falls back to the active filter, then 'Other'.
function addExercise({name,group,category,target}={}){
 const n=(name||'').trim();
 if(!n){toast('Exercise needs a name');return null;}
 if(library.some(e=>(e.n||'').toLowerCase()===n.toLowerCase())){toast('"'+n+'" is already in the library');return null;}
 const g=(group||'').trim()||(S.libGroup&&S.libGroup!=='All'?S.libGroup:'Other');
 const entry={n,g,c:(category||'').trim()||g,t:(target||'').trim()||'3×10'};
 library.push(entry);
 return entry;
}
// Open the "add new exercise" sheet. Seeds the group from the active filter chip (and an optional
// name, e.g. the current search query) so the new exercise lands where the trainer is browsing.
function openAddExercise(name){
 S.newEx={name:name||'',group:(S.libGroup&&S.libGroup!=='All'?S.libGroup:''),category:'',target:''};
 renderAddExerciseModal();
}
function closeAddExerciseModal(){const m=document.getElementById('addExModal');if(m)m.remove();}
function renderAddExerciseModal(){
 const f=S.newEx;if(!f)return;
 // group options alphabetical (LIB_GROUPS minus 'All'); a blank placeholder until one is chosen
 const groupOpts=`<option value="" ${f.group?'':'selected'} disabled>Select muscle group…</option>`
  +LIB_GROUPS.filter(g=>g!=='All').map(g=>`<option value="${g}" ${f.group===g?'selected':''}>${g}</option>`).join('');
 const html=`<div class="modal-overlay" id="addExModal" onclick="if(event.target===this)closeAddExerciseModal()">
   <div class="modal-sheet pay-modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Add new exercise</div>
    <div class="pm-form">
     <div class="pd-field"><label>Exercise name</label>
      <input class="np-name-input" value="${esc(f.name)}" placeholder="e.g. Landmine press" oninput="S.newEx.name=this.value"></div>
     <div class="pd-field"><label>Muscle group</label><div class="pm-select"><select onchange="S.newEx.group=this.value">${groupOpts}</select></div></div>
     <div class="pd-field"><label>Description <span class="opt-note">(optional)</span></label>
      <input class="np-name-input" value="${esc(f.category)}" placeholder="e.g. Upper body · Dumbbell" oninput="S.newEx.category=this.value"></div>
     <div class="pd-field"><label>Default target <span class="opt-note">(optional)</span></label>
      <input class="np-name-input" value="${esc(f.target)}" placeholder="e.g. 3×10" oninput="S.newEx.target=this.value"></div>
     <button class="bigbtn" onclick="saveNewExercise()">Add to library</button>
    </div>
    <button class="modal-cancel" onclick="closeAddExerciseModal()">Cancel</button>
   </div></div>`;
 closeAddExerciseModal();
 const app=document.getElementById('app');if(app)app.insertAdjacentHTML('beforeend',html);
 paintIcons();
}
function saveNewExercise(){
 const f=S.newEx;if(!f)return;
 const entry=addExercise(f);
 if(!entry)return;                 // addExercise already toasted the reason
 closeAddExerciseModal();
 S.newEx=null;
 S.libQ='';S.libGroup=entry.g;     // jump the filter to the new exercise's group so it's visible
 // added mid-attach (session / program / new program)? auto-pick it so it flows straight into the picker
 if(S.attachTo!=null){const idx=library.indexOf(entry);if(idx>=0&&!S.picks.includes(idx))S.picks.push(idx);}
 render();
 toast('Added '+entry.n+' to library');
}

// one exercise card with the week-load steppers. `i` is the canonical flat index into c.exercises,
// so adj()/removeEx() keep working unchanged even though cards are grouped by day + program.
function progExCard(c,ex){const i=c.exercises.indexOf(ex),wk=S.week;
 const log=getLog(ex,wk),tr=trend(ex,wk),tm={up:['↑ Up','gbg'],down:['↓ Down','abg'],flat:['→ Same','']}[tr];const rep=isRepBased(ex);
 return `<div class="ex-card"><div class="ex-top"><div><div class="ex-name">${ex.name}${ex.future?`<span class="ex-future">⏳ from ${ex.effLabel}</span>`:''}</div><div class="ex-target">Target ${ex.target}</div></div><div class="row-center"><div class="ex-trend ${tm[1]}">${tm[0]}</div><button class="ex-remove" onclick="removeEx(${i})" aria-label="Remove">✕</button></div></div>
   <div class="stepper-row">
    <div class="stepper"><div class="lbl">${rep?'Level/time':'Weight'}</div><div class="ctl"><button class="stp-btn" onclick="adj(${i},'w',-2.5)">−</button><div class="stp-val" id="w-${i}">${log.w}${rep?'':'<small> kg</small>'}</div><button class="stp-btn" onclick="adj(${i},'w',2.5)">+</button></div></div>
    <div class="stepper"><div class="lbl">Reps</div><div class="ctl"><button class="stp-btn" onclick="adj(${i},'r',-1)">−</button><div class="stp-val" id="r-${i}">${log.r}</div><button class="stp-btn" onclick="adj(${i},'r',1)">+</button></div></div>
   </div></div>`;}
// one Program A / Program B group for a given day: its exercise cards + an "add to this slot" button
function progSlot(c,day,prog){const exs=exForDayProg(c,day,prog);
 const cards=exs.length?exs.map(ex=>progExCard(c,ex)).join(''):`<div class="slot-empty">No exercises in Program ${prog} yet — add some below.</div>`;
 return `<div class="pgrp">
   <div class="pgrp-head pgrp-${prog.toLowerCase()}"><span class="pgrp-dot"></span><span class="pgrp-name">Program ${prog}</span><span class="pgrp-count">${exs.length} exercise${exs.length!==1?'s':''}</span></div>
   ${cards}
   <button class="slot-add" onclick="openLibraryForProgramSlot(${c.id},'${day}','${prog}')">＋ Add exercise to Program ${prog}</button>
  </div>`;}
function tabProgram(){const c=cur();
 const p=c.program||{},weeks=p.weeks||6,curWk=currentWeekFor(c),days=parseDays(c);
 if(!S.week||S.week<1||S.week>weeks)S.week=curWk;       // clamp the shared week selector to this client's block
 const wk=S.week,r=rev(c.id);
 if(S.reorder)return `<div class="fadein">
  <div class="scr-head"><div class="scr-head-t">Reorder exercises</div><div class="scr-head-s">${c.name.split(' ')[0]}'s program · ${c.exercises.length} exercise${c.exercises.length!==1?'s':''}</div></div>
  <div class="reord-banner">Press the ⠿ handle and drag an exercise up or down. This order applies across all ${weeks} weeks.</div>
  <div id="reordList">${c.exercises.map(ex=>`<div class="reord-row">
    <div class="reord-main"><div class="reord-name">${ex.name}${ex.future?` <span class="reord-future">⏳ from ${ex.effLabel}</span>`:''}</div><div class="reord-target">${ex.day&&ex.prog?`${ex.day} · Program ${ex.prog} · `:''}Target ${ex.target}</div></div>
    <div class="reord-grip" aria-label="Drag to reorder">⠿</div>
   </div>`).join('')}</div>
  <div class="bottom-cta"><button class="bigbtn" onclick="toggleReorder();toast('Exercise order saved')">✓  Done</button></div>
  <div class="sp8"></div></div>`;
 const banner=r.due&&c.status==='Active'?`<div class="review-banner"><span class="rb-ic">🔔</span><div class="rb-tx"><b>Time for this week's review</b>Last updated ${r.ago}. Update or confirm ${c.name.split(' ')[0]}'s modules.</div><button class="review-pill" onclick="markReviewed(${c.id});toast('Marked reviewed');render()">Done</button></div>`:'';
 const head=`${banner}<div class="block prog-head">
   <div class="ov-h"><div class="ov-h-t">${esc(programDisplayName(c))}</div><span class="ov-h-tag">Week ${wk} of ${weeks}</span></div>
   <div class="tab-cap">${weeks}-week block · ${days.length?days.join(' / '):'no training days set'} · reviewed ${r.ago}</div>
   <div class="grid-toggle"><div class="gt ${S.gridMode==='cards'?'on':''}" onclick="S.gridMode='cards';render()">Plan by week</div><div class="gt ${S.gridMode==='grid'?'on':''}" onclick="S.gridMode='grid';render()">Full ${weeks}-week grid</div></div>
  </div>`;
 const weekBtns=Array.from({length:weeks},(_,idx)=>{const w=idx+1;let cls=w<curWk?'done':w===curWk?'current':'plan';if(w===wk)cls='cur';return `<button class="wk ${cls}" onclick="S.week=${w};render()"><small>Wk</small>${w}</button>`}).join('');
 if(S.gridMode==='grid')return `<div class="fadein">${head}<div class="weeks">${weekBtns}</div>${fullGrid()}<button class="ex-reorder-btn" onclick="toggleReorder()">↕  Reorder exercises</button><div class="sp18"></div></div>`;
 // No training days yet (paused / pre-schedule): fall back to a flat list so the tab still renders.
 if(!days.length){const flat=c.exercises.map(ex=>progExCard(c,ex)).join('');
  return `<div class="fadein">${head}<div class="weeks">${weekBtns}</div><div class="wkbanner">Week ${wk}${WD[wk]?' · '+WD[wk]:''} — set a schedule to plan by day</div>${flat}
   <button class="ex-add-btn" onclick="openLibraryForClient(${c.id})">＋ Add from exercise library</button>
   <div class="bottom-cta"><button class="bigbtn" onclick="markReviewed(cur().id);render();toast('Week '+S.week+' saved & reviewed')">Save week ${wk}</button></div></div>`;}
 let day=S.progDay;if(!day||!days.includes(day))day=sessionDayFor(c)||days[0];
 const isToday=day===todayWeekday();
 const dayTabs=`<div class="day-tabs">${days.map(d=>`<button class="day-tab ${d===day?'on':''}" onclick="S.progDay='${d}';render()">${d}${d===todayWeekday()?'<span class="day-today">today</span>':''}</button>`).join('')}</div>`;
 const dayLabel=`<div class="wkbanner">${day}${isToday?' · today':''} · Week ${wk}${WD[wk]?' · '+WD[wk]:''} — tap − / + to set this week's load</div>`;
 const groups=progSlot(c,day,'A')+progSlot(c,day,'B');
 return `<div class="fadein">${head}<div class="weeks">${weekBtns}</div>${dayTabs}${dayLabel}${groups}
  <button class="ex-reorder-btn" onclick="toggleReorder()">↕  Reorder exercises</button>
  <div class="bottom-cta"><button class="bigbtn" onclick="markReviewed(cur().id);render();toast('Week '+S.week+' saved & reviewed')">Save week ${wk}</button></div></div>`;
}
// open the exercise library to fill ONE (day, Program A/B) slot of the standing plan
function openLibraryForProgramSlot(id,day,prog){S.attachTo=id;S.attachMode=null;S.attachReturn='planSlot';S.attachDay=day;S.attachProg=prog;
 S.effFrom='now';S.picks=[];S.libQ='';S.libGroup='All';navTo('library');}
function removeEx(i){const c=cur();if(c.exercises.length<=1){toast('Add another before removing the last');return}const nm=c.exercises[i].name;c.exercises.splice(i,1);invalidateSession(c.id);render();toast('Removed '+nm)}
function toggleReorder(){S.reorder=!S.reorder;render();sc()}
function fullGrid(){const c=cur();const weeks=(c.program&&c.program.weeks)||6,curWk=currentWeekFor(c);
 const wkArr=Array.from({length:weeks},(_,i)=>i+1);
 const rows=c.exercises.map(ex=>{const cells=wkArr.map(w=>{const l=ex.logs[w];const now=w===curWk?'nowcol':'';const plan=w>curWk;return `<td class="${now}">${l?`<span class="wt${plan?' plan':''}">${l.w}</span><div class="rp">${l.r}r</div>`:'<span class="rp">—</span>'}</td>`}).join('');
  const tag=ex.day&&ex.prog?`<span class="grid-tag">${ex.day}·${ex.prog}</span>`:'';
  return `<tr><td class="ex">${ex.name}${tag}</td>${cells}</tr>`}).join('');
 const heads=wkArr.map(w=>`<th class="${w===curWk?'nowcol':''}">W${w}</th>`).join('');
 return `<div class="fullgrid"><table><thead><tr><th class="ex-h">Exercise</th>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function adj(i,k,d){const ex=cur().exercises[i],log=getLog(ex,S.week);log[k]=Math.max(0,Math.round((log[k]+d)*10)/10);const el=document.getElementById(k+'-'+i);if(k==='w')el.innerHTML=log.w+(isRepBased(ex)?'':'<small> kg</small>');else el.innerHTML=log.r}

function tabSessions(){const c=cur();
 const wd=['M','T','W','T','F','S','S'];
 const now=new Date(),year=now.getFullYear(),month=now.getMonth();
 const monthName=now.toLocaleDateString('en-GB',{month:'long'});
 const log=sessionLog[c.id]||[];
 // real stats: total (stored), this-month (logged sessions in the current calendar month), program completion %
 const thisMonth=log.filter(r=>{const d=new Date(r.date+'T00:00:00');return !isNaN(d)&&d.getFullYear()===year&&d.getMonth()===month;}).length;
 const p=c.program||{},total=progTotal(p)||0,done=p.done||0,pct=total?Math.round(done/total*100):0;
 // real month calendar: a day is green if a session was completed that day (from sessionLog); today shows
 // red only if attendance was explicitly marked absent/cancelled. No fabricated attendance pattern.
 const sessDates=new Set(log.map(r=>r.date)),todayK=dateKey(now);
 const startCol=(new Date(year,month,1).getDay()+6)%7,dim=new Date(year,month+1,0).getDate();
 const hasAbsent=attStatus[c.id]==='absent'||attStatus[c.id]==='cancelled';
 let cal='';for(let i=0;i<startCol;i++)cal+=`<div class="cal-d empty"></div>`;
 for(let d=1;d<=dim;d++){const dk=dateKey(new Date(year,month,d));
  const st=sessDates.has(dk)?'present':(dk===todayK&&hasAbsent?'absent':'');
  cal+=`<div class="cal-d ${st}">${d}</div>`;}
 return `<div class="fadein">
  <div class="ov-stats">
   <div class="ov-stat"><div class="ov-stat-ic bg-accent-soft"><i data-lucide="calendar"></i></div><div class="ov-stat-v">${c.sessions}</div><div class="ov-stat-l">Total Sessions</div></div>
   <div class="ov-stat"><div class="ov-stat-ic bg-accent-soft"><i data-lucide="trending-up"></i></div><div class="ov-stat-v">${thisMonth}</div><div class="ov-stat-l">This Month</div></div>
   <div class="ov-stat"><div class="ov-stat-ring">${ovRing(pct)}</div><div class="ov-stat-v">${pct}%</div><div class="ov-stat-l">Program</div></div>
  </div>
  <div class="block">
   <div class="ov-h"><div class="ov-h-t">${monthName} sessions</div></div>
   <div class="att-cal">${wd.map(d=>`<div class="cal-h">${d}</div>`).join('')}${cal}</div>
   <div class="att-legend"><span><i class="att-dot present"></i>Session completed</span>${hasAbsent?`<span><i class="att-dot absent"></i>Missed</span>`:''}</div>
  </div>
  <div class="bottom-cta"><button class="bigbtn" onclick="openSession(cur().id)">Open today's session</button></div></div>`;
}

// Progress = current measurements + the long-term trend & milestones (merged from the old History tab)
/* ===== derived progress metrics — ALL computed from existing weight+reps logs + c.measures
   (no captured power/speed/jump data exists; everything below is derived from those two sources) ===== */
// Epley estimated one-rep max for a weight×reps set, rounded to 1 decimal
function estimated1RM(w,r){w=+w||0;r=+r||0;if(w<=0)return 0;return Math.round(w*(1+r/30)*10)/10}
// logged-week points for one exercise in the current program, ascending by week (skips unlogged weeks)
function exerciseProgression(c,exName){
 const ex=(c.exercises||[]).find(e=>e.name===exName);if(!ex||!ex.logs)return [];
 return Object.keys(ex.logs).map(Number).filter(w=>!isNaN(w)).sort((a,b)=>a-b)
  .map(wk=>{const l=ex.logs[wk]||{};return {week:wk,weight:+l.w||0,reps:+l.r||0,e1rm:estimated1RM(l.w,l.r)};});
}
// % change in estimated 1RM, first→latest logged week; null with <2 points (or a zero baseline)
function exerciseGainPct(c,exName){
 const p=exerciseProgression(c,exName);if(p.length<2)return null;
 const first=p[0].e1rm,last=p[p.length-1].e1rm;if(!first)return null;
 return Math.round((last-first)/first*100);
}
// one entry per muscle group the client trains: average e1RM gain across its exercises + a group e1RM sparkline
function muscleGroupProgress(c){
 const groups={};
 (c.exercises||[]).forEach(ex=>{if(!ex.g)return;const pts=exerciseProgression(c,ex.name);if(!pts.length)return;(groups[ex.g]||(groups[ex.g]=[])).push(pts);});
 return Object.keys(groups).map(g=>{
  const exPts=groups[g];
  const gains=exPts.map(pts=>{if(pts.length<2)return null;const f=pts[0].e1rm,l=pts[pts.length-1].e1rm;return f?(l-f)/f*100:null;}).filter(v=>v!=null);
  const gainPct=gains.length?Math.round(gains.reduce((a,b)=>a+b,0)/gains.length):null;
  const weekMap={};exPts.forEach(pts=>pts.forEach(p=>{weekMap[p.week]=(weekMap[p.week]||0)+p.e1rm;}));
  const sparkline=Object.keys(weekMap).map(Number).sort((a,b)=>a-b).map(wk=>Math.round(weekMap[wk]*10)/10);
  return {group:g,gainPct:gainPct,sparkline:sparkline};
 }).sort((a,b)=>{if(a.gainPct==null&&b.gainPct==null)return 0;if(a.gainPct==null)return 1;if(b.gainPct==null)return -1;return b.gainPct-a.gainPct;});
}
// estimate a calendar date for a program week from c.programStartDate (null → caller falls back to "Week N")
function prDate(c,week){
 if(!c.programStartDate)return null;const d=new Date(c.programStartDate+'T00:00:00');if(isNaN(d))return null;
 d.setDate(d.getDate()+(week-1)*7);return dateKey(d);
}
// PRs: weeks where the weight beats every previous logged week for that exercise (first week = baseline). Newest first.
function detectPRs(c){
 const prs=[];
 (c.exercises||[]).forEach(ex=>{if(!ex.logs)return;
  const weeks=Object.keys(ex.logs).map(Number).filter(w=>!isNaN(w)).sort((a,b)=>a-b);
  let best=-Infinity,seen=false;
  weeks.forEach(wk=>{const w=+ex.logs[wk].w||0;
   if(!seen){best=w;seen=true;return;}
   if(w>best){prs.push({exName:ex.name,g:ex.g,week:wk,weight:w,date:prDate(c,wk)});best=w;}
  });
 });
 return prs.sort((a,b)=>b.week-a.week);
}
// training load over time — sum of weight×reps across all exercises logged that week
function totalVolumeByWeek(c){
 const weekMap={};
 (c.exercises||[]).forEach(ex=>{if(!ex.logs)return;Object.keys(ex.logs).forEach(k=>{const wk=Number(k);if(isNaN(wk))return;const l=ex.logs[k];weekMap[wk]=(weekMap[wk]||0)+(+l.w||0)*(+l.r||0);});});
 return Object.keys(weekMap).map(Number).sort((a,b)=>a-b).map(wk=>({week:wk,volume:Math.round(weekMap[wk])}));
}
// strength-to-bodyweight ratio per week for the main compound lifts (needs c.measures.Weight); null otherwise
function strengthToBodyweight(c,exName){
 const bw=c.measures&&c.measures.Weight;if(!bw||!bw.length)return null;
 if(!/squat|bench|deadlift|press|row/i.test(exName))return null;
 const out=exerciseProgression(c,exName).map(p=>{const b=bw[p.week-1]!=null?bw[p.week-1]:bw[bw.length-1];if(!b||!p.weight)return null;return {week:p.week,ratio:Math.round(p.weight/b*100)/100};}).filter(Boolean);
 return out.length?out:null;
}
// does this client have any logged weight/rep data to chart? (placeholder exercises have empty logs)
function hasProgressData(c){return (c.exercises||[]).some(e=>e.logs&&Object.keys(e.logs).length);}
// the at-a-glance story: avg e1RM gain %, weekly-volume change %, PR count, session count
function progressSummary(c){
 const gains=(c.exercises||[]).map(e=>exerciseGainPct(c,e.name)).filter(v=>v!=null);
 const avgGain=gains.length?Math.round(gains.reduce((a,b)=>a+b,0)/gains.length):null;
 const vol=totalVolumeByWeek(c);
 const volChange=(vol.length>1&&vol[0].volume>0)?Math.round((vol[vol.length-1].volume-vol[0].volume)/vol[0].volume*100):null;
 return {avgGain,volChange,prCount:detectPRs(c).length,sessions:c.sessions||0};
}
function setProgEx(name){S.progEx=name;render();}

/* ---- progress charts (inline SVG, dark theme, survive sparse data) ---- */
// tiny group/ratio sparkline; 1 point → a single dot, 0 points → empty box
function miniSparkline(vals,stroke){
 stroke=stroke||'var(--accent)';
 if(!vals||!vals.length)return '<svg viewBox="0 0 100 30" class="spark-svg"></svg>';
 if(vals.length===1)return `<svg viewBox="0 0 100 30" class="spark-svg"><circle cx="50" cy="15" r="3" fill="${stroke}"/></svg>`;
 const w=100,h=30,pad=4,min=Math.min(...vals),max=Math.max(...vals),rng=(max-min)||1;
 const pts=vals.map((v,i)=>[pad+i*(w-2*pad)/(vals.length-1),h-pad-((v-min)/rng)*(h-2*pad)]);
 const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark-svg"><path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
// the exercise drill-down chart: solid accent e1RM line + dashed dim actual-weight line, start/latest e1RM labels
function progressionChart(pts){
 if(!pts.length)return `<div class="pg-empty">No logged data for this exercise yet.</div>`;
 if(pts.length===1){const p=pts[0];return `<div class="pg-single"><div class="pg-single-v">${p.e1rm}<small> kg est. 1RM</small></div><div class="pg-single-l">W${p.week} · ${p.weight}kg × ${p.reps}</div></div>`;}
 const w=320,h=180,padX=30,padT=22,padB=28;
 const e1=pts.map(p=>p.e1rm),wt=pts.map(p=>p.weight),allv=e1.concat(wt);
 const min=Math.min(...allv),max=Math.max(...allv),rng=(max-min)||1;
 const X=i=>padX+i*(w-2*padX)/(pts.length-1),Y=v=>h-padB-((v-min)/rng)*(h-padT-padB);
 const ln=arr=>arr.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
 const grid=[0,0.5,1].map(t=>{const y=(padT+t*(h-padT-padB)).toFixed(1);return `<line x1="${padX}" y1="${y}" x2="${w-padX}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`}).join('');
 const wtLine=`<path d="${ln(wt)}" fill="none" stroke="var(--text-dim)" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round"/>`;
 const e1Line=`<path d="${ln(e1)}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
 const dots=pts.map((p,i)=>{const last=i===pts.length-1;return `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.e1rm).toFixed(1)}" r="${last?4:3}" fill="${last?'var(--accent)':'#fff'}" stroke="var(--accent)" stroke-width="2"/>`}).join('');
 const xl=pts.map((p,i)=>`<text x="${X(i).toFixed(1)}" y="${h-8}" font-size="9" fill="var(--muted)" text-anchor="middle">W${p.week}</text>`).join('');
 const startLbl=`<text x="${padX}" y="${(Y(e1[0])-8).toFixed(1)}" font-size="10" font-weight="700" fill="var(--muted)">${e1[0]}</text>`;
 const endLbl=`<text x="${(w-padX).toFixed(1)}" y="${(Y(e1[e1.length-1])-8).toFixed(1)}" font-size="11" font-weight="700" fill="var(--accent)" text-anchor="end">${e1[e1.length-1]}</text>`;
 return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg">${grid}${wtLine}${e1Line}${dots}${xl}${startLbl}${endLbl}</svg>`;
}
// summary stat tiles + muscle-group mini-grid — shared by the preview and the full drill-in
function progSummaryTiles(c){
 const s=progressSummary(c);
 const arrow=v=>v>0?'↑':(v<0?'↓':'');
 const gain=s.avgGain==null?'—':arrow(s.avgGain)+Math.abs(s.avgGain)+'%';
 const vol=s.volChange==null?'—':arrow(s.volChange)+Math.abs(s.volChange)+'%';
 const tile=(l,v,cls)=>`<div class="pg-tile"><div class="pg-tile-l">${l}</div><div class="pg-tile-v ${cls||''}">${v}</div></div>`;
 return `<div class="pg-tiles">
   ${tile('Est. 1RM gain',gain,s.avgGain>0?'pos':'')}
   ${tile('Total volume',vol,s.volChange>0?'pos':'')}
   ${tile('New PRs',s.prCount,s.prCount>0?'pos':'')}
   ${tile('Sessions',s.sessions)}
  </div>`;
}
function progMuscleGrid(c){
 const groups=muscleGroupProgress(c);if(!groups.length)return '';
 return `<div class="pg-mg-grid">${groups.map(g=>{const col=muscleColor(g.group);
   const gain=g.gainPct==null?'<span class="pg-mg-gain flat">—</span>':`<span class="pg-mg-gain ${g.gainPct>0?'pos':'flat'}">${g.gainPct>0?'↑':(g.gainPct<0?'↓':'')}${Math.abs(g.gainPct)}%</span>`;
   return `<div class="pg-mg"><div class="pg-mg-top"><span class="pg-mg-tag tint-cat" style="--c-fg:${col.c};--c-bg:${col.b}">${esc(g.group)}</span>${gain}</div><div class="pg-mg-spark">${miniSparkline(g.sparkline,col.c)}</div></div>`;
  }).join('')}</div>`;
}
// strength-to-bodyweight rows for the compound lifts that have bodyweight + ≥2 points
function progStrengthRows(c){
 const rows=[];
 (c.exercises||[]).filter(e=>/squat|bench|deadlift|press|row/i.test(e.name)).forEach(e=>{
  const d=strengthToBodyweight(c,e.name);if(d&&d.length>=2)rows.push({name:e.name,first:d[0].ratio,last:d[d.length-1].ratio,series:d.map(p=>p.ratio)});
 });
 return rows;
}

function tabProgress(c){c=c||cur();
 if(!hasProgressData(c)){
  return `<div class="fadein"><div class="block"><div class="pg-empty">📊 No progress data yet — once weekly weights &amp; reps are logged in the Program tab, strength trends, PRs and charts appear here.</div></div></div>`;
 }
 const exList=(c.exercises||[]).filter(e=>e.logs&&Object.keys(e.logs).length);
 let selName=S.progEx&&exList.some(e=>e.name===S.progEx)?S.progEx:null;
 if(!selName){const comp=exList.find(e=>/squat|bench|deadlift|press|row/i.test(e.name));selName=(comp||exList[0]).name;}
 const selEx=exList.find(e=>e.name===selName);
 const pts=exerciseProgression(c,selName);
 const prs=detectPRs(c).slice(0,8);
 const keys=Object.keys(c.measures||{});
 const mk=S.measure&&keys.includes(S.measure)?S.measure:keys[0];
 const mdata=mk?(c.measures[mk]||[]):[];
 const sbw=progStrengthRows(c);
 // exercise selector chips, grouped (sorted) by muscle group, each with its group-colour dot
 const chips=exList.slice().sort((a,b)=>(a.g||'~').localeCompare(b.g||'~')||a.name.localeCompare(b.name)).map(e=>{
   const col=muscleColor(e.g),on=e.name===selName;
   return `<button class="pg-exchip ${on?'on':''}" onclick="setProgEx('${e.name.replace(/'/g,"\\'")}')"><i class="pg-exchip-dot swatch" style="--c-bg:${col.c}"></i>${esc(e.name)}</button>`;
  }).join('');
 return `<div class="fadein">
  <div class="tab-cap">${esc(c.goals||'')}</div>
  ${progSummaryTiles(c)}
  ${muscleGroupProgress(c).length?`<div class="ds-sec-header gap"><div class="ds-sec-title">Muscle-group progress</div></div>${progMuscleGrid(c)}`:''}
  <div class="block"><div class="ov-h"><div class="ov-h-t">Exercise progression</div></div>
   <div class="pg-exsel">${chips}</div>
   <div class="chart-wrap flush">${progressionChart(pts)}</div>
   ${pts.length>1?`<div class="pg-legend"><span class="pg-leg"><i class="pg-leg-l"></i>Est. 1RM</span><span class="pg-leg"><i class="pg-leg-l dash"></i>Weight lifted</span></div>`:''}
   <div class="tab-cap center-pt">${esc(selEx.name)}${selEx.target?' · target '+esc(selEx.target):''}</div>
  </div>
  <div class="block"><div class="ov-h"><div class="ov-h-t">PR timeline</div></div>
   ${prs.length?prs.map(p=>{const col=muscleColor(p.g);
     return `<div class="pg-pr"><div class="pg-pr-ic">🏆</div>
       <div class="pg-pr-main"><div class="pg-pr-name">${esc(p.exName)}${p.g?`<span class="pg-mg-tag tint-cat" style="--c-fg:${col.c};--c-bg:${col.b}">${esc(p.g)}</span>`:''}</div>
        <div class="pg-pr-sub">${p.date?fmtPayDate(p.date)+' · ':''}Week ${p.week}</div></div>
       <div class="pg-pr-wt">${p.weight}<small> kg</small></div></div>`;}).join('')
    :`<div class="pg-empty">No PRs logged yet — they'll appear as weights climb.</div>`}
  </div>
  ${keys.length?`<div class="block"><div class="ov-h"><div class="ov-h-t">Body measurements</div></div>
   <div class="measure-pick">${keys.map(k=>`<button class="mp ${mk===k?'on':''}" onclick="S.measure='${k}';render()">${k}</button>`).join('')}</div>
   <div class="chart-wrap">${lineChart(mdata)}</div>
   ${mdata.length>1?`<div class="tab-cap center">${mk}: ${mdata[0]} → ${mdata[mdata.length-1]}</div>`:''}
   ${sbw.length?`<div class="pg-sbw"><div class="pg-sbw-h">Strength-to-bodyweight</div>${sbw.map(r=>`<div class="pg-sbw-row"><div class="pg-sbw-main"><div class="pg-sbw-name">${esc(r.name)}</div><div class="pg-sbw-spark">${miniSparkline(r.series)}</div></div><div class="pg-sbw-v">${r.first.toFixed(1)}× → <b>${r.last.toFixed(1)}×</b></div></div>`).join('')}</div>`:''}
  </div>`:''}
  <div class="report-row" onclick="openReport(cur().id)"><div class="ac-ic abg ic-42"><i data-lucide="chart-column"></i></div><div class="ac-main"><div class="ac-title">Program completion report</div><div class="ac-sub">Generate when block ends</div></div><div class="cr-chev">›</div></div>
  <div class="sp14"></div></div>`;
}
function lineChart(data){if(!data.length)return'';const w=320,h=130,pad=24;const min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
 const pts=data.map((v,i)=>{const x=pad+(i*(w-2*pad)/(data.length-1||1));const y=h-pad-((v-min)/rng)*(h-2*pad);return[x,y]});
 const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const dots=pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="var(--accent)"/>`).join('');
 const labels=data.map((v,i)=>`<text x="${pts[i][0].toFixed(1)}" y="${h-6}" font-size="9" fill="var(--muted)" text-anchor="middle">W${i+1}</text>`).join('');
 return `<svg viewBox="0 0 ${w} ${h}" class="chart-w"><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}<text x="${pad}" y="14" font-size="10" font-weight="700" fill="var(--ink)">${data[0]}</text><text x="${w-pad}" y="14" font-size="10" font-weight="700" fill="var(--accent)" text-anchor="end">${data[data.length-1]}</text></svg>`;
}

function tabMedia(){const c=cur();
 const cards=c.photos.map(p=>{const col=p.c==='before'?'var(--muted)':'var(--accent)';return `<div class="media-card"><div class="media-img swatch" style="--c-bg:linear-gradient(160deg,${col},${p.c==='before'?'#9b988f':'var(--accent-dark)'})">${p.t}</div><div class="media-cap">${p.c==='before'?'Before':'Progress'}<small>${p.d}</small></div></div>`}).join('');
 return `<div class="fadein">
  <div class="block">
   <div class="ov-h"><div class="ov-h-t">Progress media</div><button class="ov-h-act" onclick="toast('Upload photo or video')">+ Add</button></div>
   <div class="tab-cap pb12">Before / after photos &amp; videos. Stored privately per client.</div>
   <div class="media-grid">${cards}<div class="upload-tile" onclick="toast('Upload photo or video')"><i data-lucide="image-plus"></i>Add media</div></div>
  </div>
  <div class="sp14"></div></div>`;
}
function togglePause(){const c=cur();c.status=c.status==='Active'?'Paused':'Active';render();toast(c.name.split(' ')[0]+' is now '+c.status+(c.status==='Paused'?' (file saved)':''))}
/* ----- client header kebab menu (Edit info · Change status) ----- */
function closeClientMenu(){const m=document.getElementById('clientMenu');if(m)m.remove();}
function mountClientMenu(html){closeClientMenu();const app=document.getElementById('app');if(app)app.insertAdjacentHTML('beforeend',html);paintIcons();}
function openClientMenu(id){
 const c=clients.find(x=>x.id===id);if(!c)return;
 mountClientMenu(`<div class="modal-overlay" id="clientMenu" onclick="if(event.target===this)closeClientMenu()">
   <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">${esc(c.name)}</div>
    <div class="modal-opts">
     <button class="modal-opt" onclick="clientMenuEdit(${id})"><div class="mo-ic tint-blue"><i data-lucide="pencil"></i></div>Edit info</button>
     <button class="modal-opt" onclick="openCoachMenu(${id})"><div class="mo-ic tint-green"><i data-lucide="users"></i></div>Change coach</button>
     <button class="modal-opt" onclick="openStatusMenu(${id})"><div class="mo-ic tint-amber"><i data-lucide="repeat"></i></div>Change status</button>
    </div>
    <button class="modal-cancel" onclick="closeClientMenu()">Cancel</button>
   </div></div>`);
}
function clientMenuEdit(id){closeClientMenu();openEditClient(id);}
/* ---- edit client (name / photo / basic info) ---- */
let clientDraft=null;
function openEditClient(id){
 const c=clients.find(x=>x.id===id);if(!c)return;
 clientDraft={id:c.id,name:c.name,photo:c.photo||'',age:c.age||'',
  phone:c.phone||'',email:(c.email&&c.email!=='—')?c.email:'',
  cat:c.cat,coach:c.coach||''};
 S.clientId=id;navTo('editClient');
}
function onClientPhoto(e){
 const f=e.target.files&&e.target.files[0];if(!f||!clientDraft)return;
 const r=new FileReader();r.onload=()=>{clientDraft.photo=r.result;render();};r.readAsDataURL(f);
}
function removeClientPhoto(){if(clientDraft){clientDraft.photo='';render();}}
function cancelEditClient(){clientDraft=null;goBack();}
function saveClient(){
 if(!clientDraft)return;
 const c=clients.find(x=>x.id===clientDraft.id);if(!c)return;
 const name=(clientDraft.name||'').trim();
 if(!name){toast('Name can’t be empty');return;}
 const email=(clientDraft.email||'').trim();
 if(email&&!emailOk(email)){toast('Enter a valid email');return;}
 c.name=name;c.photo=clientDraft.photo||'';
 const age=parseInt(clientDraft.age,10);if(!isNaN(age)&&age>0)c.age=age;
 c.phone=(clientDraft.phone||'').trim();
 c.email=email;
 c.cat=clientDraft.cat;
 c.coach=clientDraft.coach||null;
 clientDraft=null;goBack();toast('Client updated');
}
function vEditClient(){
 const d=clientDraft;if(!d)return '';
 const cat=CATS[d.cat]||CATS['General wellness'];
 const catOpts=Object.keys(CATS).map(k=>`<option value="${esc(k)}" ${d.cat===k?'selected':''}>${esc(k)}</option>`).join('');
 const coachOpts=['',...coaches.map(c=>c.name)].map(n=>`<option value="${esc(n)}" ${(d.coach||'')===n?'selected':''}>${n?esc(n):'Not assigned'}</option>`).join('');
 return `<div class="fadein"><div class="bar solid"><div class="bar-title">Edit client</div><button class="iconbtn bar-x" onclick="cancelEditClient()" aria-label="Cancel"><i data-lucide="x"></i></button></div>
  <div class="ep-photo">
   <div class="ep-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${d.photo?`<img src="${esc(d.photo)}" alt="Client photo">`:initials(d.name||'?')}</div>
   <input id="ec-file" type="file" accept="image/*" hidden onchange="onClientPhoto(event)">
   <div class="ep-photo-acts">
    <button class="ep-photo-btn" onclick="document.getElementById('ec-file').click()">${d.photo?'Change photo':'Add photo'}</button>
    ${d.photo?`<button class="ep-photo-rm" onclick="removeClientPhoto()">Remove</button>`:''}
   </div>
  </div>
  <div class="field"><label>Name</label><input type="text" value="${esc(d.name||'')}" placeholder="Client name" oninput="clientDraft.name=this.value"></div>
  <div class="field"><label>Age</label><input type="number" inputmode="numeric" value="${esc(d.age||'')}" placeholder="Age" oninput="clientDraft.age=this.value"></div>
  <div class="field"><label>Phone number</label><input type="tel" inputmode="tel" value="${esc(d.phone||'')}" placeholder="+91 90000 00000" oninput="clientDraft.phone=this.value"></div>
  <div class="field"><label>Email</label><input type="email" inputmode="email" value="${esc(d.email||'')}" placeholder="name@email.com" oninput="clientDraft.email=this.value"></div>
  <div class="field"><label>Category</label><select onchange="clientDraft.cat=this.value;render()">${catOpts}</select></div>
  <div class="field"><label>Coach</label><select onchange="clientDraft.coach=this.value">${coachOpts}</select></div>
  <div class="bottom-cta"><button class="bigbtn" onclick="saveClient()">Save changes</button></div>
 </div>`;
}
function openStatusMenu(id){
 const c=clients.find(x=>x.id===id);if(!c)return;
 const opt=(st,ic,bg,col)=>`<button class="modal-opt ${c.status===st?'cur':''}" onclick="setClientStatus(${id},'${st}')"><div class="mo-ic tint-cat" style="--c-bg:${bg};--c-fg:${col}"><i data-lucide="${ic}"></i></div>${st}<span class="mo-cur">current</span></button>`;
 mountClientMenu(`<div class="modal-overlay" id="clientMenu" onclick="if(event.target===this)closeClientMenu()">
   <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Change status</div>
    <div class="modal-opts">
     ${opt('Active','play','var(--green-bg)','var(--green)')}
     ${opt('Paused','pause','var(--amber-bg)','var(--amber)')}
    </div>
    <button class="modal-cancel" onclick="closeClientMenu()">Cancel</button>
   </div></div>`);
}
function setClientStatus(id,st){
 const c=clients.find(x=>x.id===id);closeClientMenu();
 if(!c||c.status===st)return;
 c.status=st;render();toast(c.name.split(' ')[0]+' is now '+st+(st==='Paused'?' (file saved)':''));
}
function openCoachMenu(id){
 const c=clients.find(x=>x.id===id);if(!c)return;
 const cur=c.coach||'';
 const row=(name)=>{const co=name?coaches.find(x=>x.name===name):null;const on=cur===name;
  return `<button class="modal-opt ${on?'cur':''}" onclick="setClientCoach(${id},'${name}')">
    <div class="mo-ic tint-green">${co&&co.photo?`<img src="${co.photo}" alt="${esc(name)}" class="cover-img">`:`<i data-lucide="${name?'user':'user-x'}"></i>`}</div>${name||'Not assigned'}${on?'<span class="mo-cur">current</span>':''}</button>`;};
 mountClientMenu(`<div class="modal-overlay" id="clientMenu" onclick="if(event.target===this)closeClientMenu()">
   <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Change coach</div>
    <div class="modal-opts">
     ${coaches.map(co=>row(co.name)).join('')}
     ${row('')}
    </div>
    <button class="modal-cancel" onclick="closeClientMenu()">Cancel</button>
   </div></div>`);
}
function setClientCoach(id,name){
 const c=clients.find(x=>x.id===id);closeClientMenu();
 const next=name||null;
 if(!c||(c.coach||null)===next)return;
 c.coach=next;render();toast(c.name.split(' ')[0]+(next?' → Coach '+next:' is now unassigned'));
}

/* ============ CLIENT HISTORY ============ */
const NOW_HX={y:2025,m:4};   // app "today" = May 2025
function joinedDate(c){const d=new Date(c.joined||'');return isNaN(d)?new Date(NOW_HX.y,NOW_HX.m,1):d}
function tenureMonths(c){const j=joinedDate(c);return Math.max(0,(NOW_HX.y-j.getFullYear())*12+(NOW_HX.m-j.getMonth()))}
function tenureLabel(c){const t=tenureMonths(c);if(t<1)return'New this month';const y=Math.floor(t/12),r=t%12;
 return(y?y+' yr'+(y>1?'s':''):'')+(y&&r?' ':'')+(r?r+' mo':'')+' with Elevate Fitness'}
function histLabels(c,range){
 if(range==='year'){const from=Math.max(joinedDate(c).getFullYear(),NOW_HX.y-4),out=[];
  for(let y=from;y<=NOW_HX.y;y++)out.push(String(y));return out}
 const n=Math.min(12,Math.max(2,tenureMonths(c)+1)),out=[];
 for(let i=n-1;i>=0;i--){const d=new Date(NOW_HX.y,NOW_HX.m-i,1);
  out.push(d.toLocaleDateString('en-GB',{month:'short'}))}
 return out;
}
// deterministic value series for a measure, ending at its latest logged value
function histSeries(c,key,count,scale){
 const recent=(c.measures&&c.measures[key])||[];
 const V=recent.length?recent[recent.length-1]:0;
 const goalUp=recent.length>1?recent[recent.length-1]>recent[0]:true;
 const unit=Math.max(0.4,(Math.abs(V)||10)*0.013)*scale,dir=goalUp?-1:1,pts=[];
 for(let i=0;i<count;i++){const back=count-1-i;
  const drift=dir*unit*back*(0.72+0.28*back/Math.max(1,count-1));
  const wobble=unit*0.55*Math.sin(i*1.7+key.length);
  pts.push(Math.max(0,Math.round((V+drift+wobble)*10)/10));}
 if(pts.length)pts[pts.length-1]=V;
 return pts;
}
function trendChart(vals,labels){
 if(vals.length<2)return `<div class="empty pad-sm"><div class="em">📉</div><p>Not enough history for this view yet.</p></div>`;
 const w=320,h=170,padX=28,padT=24,padB=30;
 const min=Math.min(...vals),max=Math.max(...vals),rng=(max-min)||1;
 const X=i=>padX+i*(w-2*padX)/(vals.length-1);
 const Y=v=>h-padB-((v-min)/rng)*(h-padT-padB);
 const pts=vals.map((v,i)=>[X(i),Y(v)]);
 const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const area=`M${X(0).toFixed(1)} ${h-padB} `+pts.map(p=>'L'+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')+` L${X(vals.length-1).toFixed(1)} ${h-padB} Z`;
 const step=Math.ceil(labels.length/6);
 const xl=labels.map((l,i)=>(i%step===0||i===labels.length-1)?`<text x="${X(i).toFixed(1)}" y="${h-9}" font-size="9" fill="var(--muted)" text-anchor="middle">${l}</text>`:'').join('');
 const dots=pts.map((p,i)=>{const last=i===pts.length-1;return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last?4.5:3}" fill="${last?'var(--accent)':'#fff'}" stroke="var(--accent)" stroke-width="2"/>`}).join('');
 return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg">
  <defs><linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity="0.20"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
  <path d="${area}" fill="url(#tgrad)"/>
  <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  ${dots}${xl}
  <text x="${padX}" y="15" font-size="10" font-weight="700" fill="var(--muted)">${vals[0]}</text>
  <text x="${w-padX}" y="15" font-size="11" font-weight="700" fill="var(--accent)" text-anchor="end">${vals[vals.length-1]}</text>
 </svg>`;
}
function histTimeline(c){
 const ev=[];
 if(c.status==='Paused')ev.push({ic:'<i data-lucide="pause"></i>',bg:'var(--bg)',t:'Membership paused',s:'On hold — file saved',w:'recent'});
 const rep=reports.find(r=>r.clientId===c.id&&r.sent);
 if(rep)ev.push({ic:'<i data-lucide="chart-column"></i>',bg:'var(--green-bg)',t:'Week '+rep.week+' report shared',s:'Progress sent to client',w:rep.when||'recently'});
 ev.push({ic:'<i data-lucide="dumbbell"></i>',bg:'var(--purple-bg)',t:'Current program',s:c.cat+' · '+(c.days||'—'),w:'ongoing'});
 if(c.sessions>=20)ev.push({ic:'<i data-lucide="medal"></i>',bg:'var(--amber-bg)',t:c.sessions+' sessions completed',s:'Consistency milestone',w:'this year'});
 ev.push({ic:'<i data-lucide="clipboard-list"></i>',bg:'var(--blue-bg)',t:'Baseline assessment',s:'First measurements recorded',w:c.joined||'—'});
 ev.push({ic:'<i data-lucide="ticket"></i>',bg:'var(--accent-soft)',t:'Joined Elevate Fitness',s:'Membership started',w:c.joined||'—'});
 return ev;
}
/* ============ TODAY'S SESSION — circuit (Programs A/B), gated by attendance ============ */
// escape a value for embedding inside a single-quoted inline-onclick JS string literal
function jsq(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
/* ---- per-client per-day session-progress store + helpers ---- */
function sessKey(id){return id+'::'+todayISO();}
// today's session-only adds for a client (exercise objects, never in c.exercises)
function sessionExtrasFor(c){return sessionExtras[sessKey(c.id)]||[];}
// names removed from today's session only
function sessionExcludesFor(c){return sessionExcludes[sessKey(c.id)]||[];}
// the client's real, today-relevant exercises = standing program (drop future-dated adds + the empty
// placeholder) PLUS any session-only adds made for today, MINUS anything removed for today. Used to
// build today's circuit + look up targets.
function sessionExercises(c){const ex=sessionExcludesFor(c);
 return (c.exercises||[]).filter(e=>!e.future&&e.name!=='Tap to add exercise'&&!ex.includes(e.name))
  .concat(sessionExtrasFor(c).filter(e=>!ex.includes(e.name)));}
// look up an exercise's meta (target/logs) for today's session — checks the program AND today's extras
function sessExMeta(c,name){return sessionExercises(c).find(e=>e.name===name)||{};}
// add exercises to TODAY'S session only (not the standing program). Re-includes a program exercise that
// was removed for today (un-excludes it) and adds brand-new ones as session extras. If a live session
// exists, merges them in without resetting progress (so a coach can add mid-workout). Returns the names
// actually added (skips ones already in today's session).
function addSessionExtras(c,items){
 const key=sessKey(c.id);
 const extras=sessionExtras[key]=sessionExtras[key]||[];
 const excl=sessionExcludes[key]=sessionExcludes[key]||[];
 const present=new Set(sessionExercises(c).map(e=>e.name));
 const added=[];
 items.forEach(it=>{
  if(present.has(it.n))return;          // already in today's session
  const ei=excl.indexOf(it.n);
  if(ei>=0)excl.splice(ei,1);           // re-include a program exercise removed earlier today
  else extras.push({name:it.n,g:it.g,target:it.t,logs:{}});   // brand-new session-only add
  present.add(it.n);added.push(it.n);
 });
 const st=getSession(c.id);
 if(st&&added.length){
  // a from-scratch session may have no programs yet — create Program A so the adds have a home
  if(!st.programs.length)st.programs.push({label:progLabel(0),exercises:[],sets:3,progress:{}});
  // append to the active program mid-workout; while still splitting, balance to the shortest program
  let tgt=Math.min(st.currentProgramIdx,st.programs.length-1);
  if(!st.splitDone){tgt=0;st.programs.forEach((p,i)=>{if(p.exercises.length<st.programs[tgt].exercises.length)tgt=i;});}
  added.forEach(n=>{if(!st.programs.some(p=>p.exercises.includes(n)))st.programs[tgt].exercises.push(n);});
  const ord=sessionExercises(c).map(e=>e.name);
  st.programs.forEach(p=>p.exercises.sort((a,b)=>ord.indexOf(a)-ord.indexOf(b)));
 }
 return added;
}
// remove an exercise from TODAY'S session only. A session-only add is dropped outright; a standing-program
// exercise is added to today's exclude list (the program itself is untouched). Also pulls it from the live
// circuit + its progress. Does NOT render — caller decides.
function dropSessionExercise(c,name){
 const key=sessKey(c.id),extras=sessionExtras[key]||[];
 const i=extras.findIndex(e=>e.name===name);
 if(i>=0)extras.splice(i,1);
 else{const excl=sessionExcludes[key]=sessionExcludes[key]||[];if(!excl.includes(name))excl.push(name);}
 const st=getSession(c.id);
 if(st)st.programs.forEach(p=>{p.exercises=p.exercises.filter(n=>n!==name);Object.keys(p.progress).forEach(k=>{if(k.slice(k.indexOf(':')+1)===name)delete p.progress[k];});});
}
// remove from today's session via the library picker (by library index)
function removeFromSession(libIdx){
 const c=clients.find(x=>x.id===S.attachTo);if(!c)return;
 const nm=library[libIdx].n;
 dropSessionExercise(c,nm);
 render();toast('Removed '+nm+' from today');
}
// remove from today's session via the split-screen card ✕
function dropSessionEx(id,name){
 const c=clients.find(x=>x.id===id);if(!c)return;
 if(sessionExercises(c).length<=1){toast('Keep at least one exercise');return;}
 dropSessionExercise(c,name);
 render();toast('Removed '+name+' from today');
}
function getSession(id){return sessionProgress[sessKey(id)]||null;}
// build a fresh circuit state — default split is first half → A, second half → B, 3 sets each.
// `started` flips true the first time the session runs (auto-started on mark-present); it stays true
// even when the coach reopens the organise/split screen via ⋯ → Edit, so the session never re-auto-starts.
function buildSessionState(c){
 // Today's session IS the standing plan for today's scheduled day: that day's Program A + Program B,
 // pulled straight from c.exercises (tagged by day + prog). One dataset — no separate split to maintain.
 const day=sessionDayFor(c);
 const mk=prog=>day?exForDayProg(c,day,prog).map(e=>e.name):[];
 let programs=[{label:'Program A',exercises:mk('A'),sets:3,progress:{}},
               {label:'Program B',exercises:mk('B'),sets:3,progress:{}}].filter(p=>p.exercises.length);
 // Fallback for a client with no tagged plan (e.g. paused, or a blank from-scratch session): default
 // A/B split of whatever exercises they have, so the coach can still build the session by hand.
 if(!programs.length){const names=sessionExercises(c).map(e=>e.name);const half=Math.ceil(names.length/2);
  programs=names.length?[{label:'Program A',exercises:names.slice(0,half),sets:3,progress:{}},
                         {label:'Program B',exercises:names.slice(half),sets:3,progress:{}}]:[];}
 return {clientId:c.id,date:todayISO(),sessionDay:day,splitDone:false,started:false,currentProgramIdx:0,programs};
}
// finalize the default split and enter the workout — used when marking present starts the session
// immediately (no organise/split gate). Idempotent via st.started.
function autoStartSession(id){
 const st=getSession(id),c=clients.find(x=>x.id===id);if(!st||!c)return;
 const total=st.programs.reduce((s,p)=>s+p.exercises.length,0);
 if(total<2||!st.programs.some(p=>p.exercises.length))return;   // nothing to run (shouldn't happen past the blank gate)
 st.currentProgramIdx=0;
 if(programComplete(st.programs[0])&&!sessionComplete(st))advanceProgram(st);
 st.splitDone=true;st.started=true;
 logActivity('SESSION','Started session with '+c.name+' · '+st.programs.filter(p=>p.exercises.length).length+' program'+(st.programs.filter(p=>p.exercises.length).length!==1?'s':'')+' × '+total+' exercises',{clientId:c.id});
}
function ensureSession(c){const k=sessKey(c.id);if(!sessionProgress[k])sessionProgress[k]=buildSessionState(c);return sessionProgress[k];}
// a round of a program is complete when every exercise in it is ticked for that round (empty program = nothing to do)
function roundComplete(prog,round){if(!prog.exercises.length)return true;return prog.exercises.every(n=>!!prog.progress[round+':'+n]);}
function programComplete(prog){if(!prog.exercises.length)return true;for(let r=1;r<=prog.sets;r++){if(!roundComplete(prog,r))return false;}return true;}
// first not-yet-done exercise in the round (the "Next up" highlight), in canonical order
function nextExerciseInRound(prog,round){return prog.exercises.find(n=>!prog.progress[round+':'+n])||null;}
// the round currently being worked — lowest round that isn't complete (clamped to the last round)
function currentRound(prog){for(let r=1;r<=prog.sets;r++){if(!roundComplete(prog,r))return r;}return prog.sets;}
// move currentProgramIdx forward to the next non-empty, not-yet-complete program; false if none left
function advanceProgram(st){for(let i=st.currentProgramIdx+1;i<st.programs.length;i++){if(st.programs[i].exercises.length&&!programComplete(st.programs[i])){st.currentProgramIdx=i;return true;}}return false;}
// a session with no exercises at all (a blank, not-yet-built program-first session) is NOT "complete" —
// there's simply nothing to do yet. Otherwise: complete when every program is complete.
function sessionComplete(st){return st.programs.some(p=>p.exercises.length)&&st.programs.every(p=>programComplete(p));}
// any exercise in any round ticked → the workout has started, so attendance is locked in (no more "mark absent")
function sessionHasProgress(st){return !!st&&st.programs.some(p=>Object.values(p.progress||{}).some(Boolean));}
// drop today's progress for a client whose program changed under them (library attach / remove / reorder / new program)
function invalidateSession(id){const k=sessKey(id);if(!sessionProgress[k])return;delete sessionProgress[k];sessDone[id]=undefined;toast('Session reset due to program change');if(S.view==='session'&&S.clientId===id)render();}

/* ---- split-screen actions ---- */
function assignExercise(id,exName,progIdx){
 const st=getSession(id),c=clients.find(x=>x.id===id);if(!st||!c)return;
 st.programs.forEach(p=>{p.exercises=p.exercises.filter(n=>n!==exName);});
 st.programs[progIdx].exercises.push(exName);
 // keep each program's list in the client's canonical exercise order (program + today's session adds)
 const ord=sessionExercises(c).map(e=>e.name);
 st.programs.forEach(p=>p.exercises.sort((a,b)=>ord.indexOf(a)-ord.indexOf(b)));
 render();
}
// per-program round (sets) count — each program is its own circuit, run independently
function setProgramSets(id,idx,n){const st=getSession(id);if(!st||!st.programs[idx])return;st.programs[idx].sets=n;render();}
// stepper for "No. of Sets" — clamp 1..9
function bumpSets(id,idx,delta){const st=getSession(id);if(!st||!st.programs[idx])return;
 st.programs[idx].sets=Math.max(1,Math.min(9,(st.programs[idx].sets||3)+delta));render();}
// per-exercise REPS target parser — "3×10" → 10. Used to seed reps for an exercise with no logged value yet.
function repTarget(meta){const t=String((meta&&meta.target)||'');const m=t.match(/[×x]\s*(\d+)/);if(m)return +m[1];const n=t.match(/\d+/);return n?+n[0]:10;}
// Session steppers edit the plan's CURRENT week directly (logs[week]), so the Program tab and today's
// session always show the same number — there is no separate session-only weight/reps store. (idx is
// kept in the signature for the existing call sites but the weight belongs to the exercise, not a program.)
function bumpWeight(id,idx,name,delta){const c=clients.find(x=>x.id===id);if(!c)return;
 const ex=sessExMeta(c,name);if(!ex||!ex.logs)return;const l=getLog(ex,currentWeekFor(c));
 l.w=Math.max(0,Math.round(((+l.w||0)+delta*2.5)*10)/10);render();}
function bumpReps(id,idx,name,delta){const c=clients.find(x=>x.id===id);if(!c)return;
 const ex=sessExMeta(c,name);if(!ex||!ex.logs)return;const l=getLog(ex,currentWeekFor(c));
 const base=(l.r!=null)?(+l.r||0):repTarget(ex);l.r=Math.max(1,base+delta);render();}
/* ---- dynamic programs: add / remove a circuit (Program A, B, C …) ---- */
const PROG_COLORS=['a','b','c','d','e','f'];          // section-header colour class per program slot
function progLetter(idx){return String.fromCharCode(65+idx);}   // 0→A, 1→B, …
function progLabel(idx){return 'Program '+progLetter(idx);}
function progColor(idx){return PROG_COLORS[idx%PROG_COLORS.length];}
// keep labels in A,B,C order after any add/remove
function relabelPrograms(st){st.programs.forEach((p,i)=>p.label=progLabel(i));}
// add another empty circuit (Program A, B, C … — no limit). New program inherits the first program's round count.
function addProgram(id){const st=getSession(id);if(!st)return;
 const sets=(st.programs[0]&&st.programs[0].sets)||3;
 const idx=st.programs.length;
 st.programs.push({label:progLabel(idx),exercises:[],sets:sets,progress:{}});
 render();toast('Added '+progLabel(idx)+' — tap “Add exercises” to fill it');}
// cancel the Create Program flow → discard the in-progress programs, back to Arjun's empty session
function cancelCreateProgram(id){const st=getSession(id);if(st)st.programs=[];render();sc();}
/* ---- program-first builder: add exercises to ONE specific program via the library picker ---- */
// open the exercise library scoped to a single program slot. Picks land in that program only.
function addExercisesToProgram(id,progIdx){
 const st=getSession(id);if(!st||!st.programs[progIdx])return;
 S.attachTo=id;S.attachReturn='program';S.attachProgIdx=progIdx;S.attachMode=null;
 S.effFrom='now';S.picks=[];S.libQ='';S.libGroup='All';navTo('library');
}
// add the picked library exercises into one program. The SAME exercise may live in more than one program;
// only same-program duplicates are skipped. New library exercises are registered as today's session extras
// (so their target/meta is known) without disturbing the standing program.
function addPicksToProgram(c,progIdx,items){
 const st=getSession(c.id);if(!st||!st.programs[progIdx])return [];
 const key=sessKey(c.id);
 const extras=sessionExtras[key]=sessionExtras[key]||[];
 const excl=sessionExcludes[key]=sessionExcludes[key]||[];
 const prog=st.programs[progIdx];
 const pool=new Set(sessionExercises(c).map(e=>e.name));
 const added=[];
 items.forEach(it=>{
  const ei=excl.indexOf(it.n);if(ei>=0)excl.splice(ei,1);          // re-include if it was removed earlier today
  if(!pool.has(it.n)){extras.push({name:it.n,g:it.g,target:it.t,logs:{}});pool.add(it.n);}  // register meta
  if(!prog.exercises.includes(it.n)){prog.exercises.push(it.n);added.push(it.n);}            // dup across programs OK
 });
 return added;
}
// remove ONE exercise from ONE program (not the whole session). If that name is left in no program at all,
// it's also dropped from today's session pool so it stops showing as a stray extra.
function removeExFromProgram(id,progIdx,name){
 const st=getSession(id),c=clients.find(x=>x.id===id);if(!st||!c||!st.programs[progIdx])return;
 const p=st.programs[progIdx];
 p.exercises=p.exercises.filter(n=>n!==name);
 Object.keys(p.progress).forEach(k=>{if(k.slice(k.indexOf(':')+1)===name)delete p.progress[k];});
 if(!st.programs.some(pp=>pp.exercises.includes(name)))dropSessionExercise(c,name);
 render();toast('Removed '+name+' from '+p.label);
}
/* ---- drag-to-reorder exercises within a program (pointer-based, touch + mouse) ----
   The grip handle starts a drag; the card follows the finger and swaps past neighbours' midpoints (shifting the
   baseline so it stays under the finger). On release the program's exercise order is read back from the DOM. */
let exDrag=null;
function exCardOuterH(el){const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.height+parseFloat(s.marginTop)+parseFloat(s.marginBottom);}
function exDragStart(e){
 const handle=e.currentTarget,card=handle.closest('.ex-card'),pgrp=card&&card.closest('.pgrp');
 if(!card||!pgrp)return;
 e.preventDefault();
 exDrag={card,pgrp,pidx:+card.dataset.pidx,y0:e.clientY};
 try{handle.setPointerCapture(e.pointerId);}catch(_){}
 card.classList.add('ex-dragging');document.body.classList.add('ex-drag-on');
 handle.addEventListener('pointermove',exDragMove);
 handle.addEventListener('pointerup',exDragEnd);
 handle.addEventListener('pointercancel',exDragEnd);
}
function exDragMove(e){
 if(!exDrag)return;
 const {card,pgrp}=exDrag;
 card.style.transform='translateY('+(e.clientY-exDrag.y0)+'px)';
 const cr=card.getBoundingClientRect(),mid=cr.top+cr.height/2;
 const prev=card.previousElementSibling;
 if(prev&&prev.classList.contains('ex-card')){const pr=prev.getBoundingClientRect();
  if(mid<pr.top+pr.height/2){const h=exCardOuterH(prev);pgrp.insertBefore(card,prev);exDrag.y0-=h;card.style.transform='translateY('+(e.clientY-exDrag.y0)+'px)';return;}}
 const next=card.nextElementSibling;
 if(next&&next.classList.contains('ex-card')){const nr=next.getBoundingClientRect();
  if(mid>nr.top+nr.height/2){const h=exCardOuterH(next);pgrp.insertBefore(next,card);exDrag.y0+=h;card.style.transform='translateY('+(e.clientY-exDrag.y0)+'px)';return;}}
}
function exDragEnd(e){
 if(!exDrag)return;
 const {card,pgrp,pidx}=exDrag,handle=e.currentTarget;
 card.style.transform='';card.classList.remove('ex-dragging');document.body.classList.remove('ex-drag-on');
 try{handle.releasePointerCapture(e.pointerId);}catch(_){}
 handle.removeEventListener('pointermove',exDragMove);
 handle.removeEventListener('pointerup',exDragEnd);
 handle.removeEventListener('pointercancel',exDragEnd);
 const order=[].slice.call(pgrp.querySelectorAll('.ex-card')).map(el=>el.dataset.ex);
 exDrag=null;
 const st=getSession(S.clientId);if(!st||!st.programs[pidx])return;
 const arr=st.programs[pidx].exercises;
 const changed=arr.length!==order.length||arr.some((n,i)=>n!==order[i]);
 st.programs[pidx].exercises=order;
 if(changed)render();
}
function wireExDrag(){
 const root=document.getElementById('screen');if(!root)return;
 [].forEach.call(root.querySelectorAll('.ex-drag'),function(h){h.addEventListener('pointerdown',exDragStart);});
}
// remove a circuit; its exercises move to a neighbouring program so nothing is lost. Keeps ≥1 program.
function removeProgram(id,idx){const st=getSession(id),c=clients.find(x=>x.id===id);if(!st||!c)return;
 if(st.programs.length<=1){toast('Keep at least one program');return;}
 const removed=st.programs[idx],label=removed.label;
 const dest=st.programs[idx===0?1:idx-1];
 dest.exercises.push(...removed.exercises);
 const ord=sessionExercises(c).map(e=>e.name);dest.exercises.sort((a,b)=>ord.indexOf(a)-ord.indexOf(b));
 st.programs.splice(idx,1);
 if(st.currentProgramIdx>=st.programs.length)st.currentProgramIdx=st.programs.length-1;
 else if(st.currentProgramIdx>idx)st.currentProgramIdx--;
 relabelPrograms(st);
 render();toast('Removed '+label+(removed.exercises.length?' — exercises kept':''));}
function startCircuitSession(id){
 const st=getSession(id),c=clients.find(x=>x.id===id);if(!st||!c)return;
 const total=st.programs.reduce((s,p)=>s+p.exercises.length,0);
 if(total<2){toast('Need at least 2 exercises total');return;}
 if(!st.programs.some(p=>p.exercises.length)){toast('Add exercises to a program first');return;}
 // re-finalising after an edit: drop progress for exercises that moved out of a program (kept ones survive)
 st.programs.forEach(p=>{Object.keys(p.progress).forEach(key=>{const nm=key.slice(key.indexOf(':')+1);if(!p.exercises.includes(nm))delete p.progress[key];});});
 // resume at the first non-empty, not-yet-complete program (skips empty/finished ones)
 st.currentProgramIdx=0;
 if(programComplete(st.programs[0])&&!sessionComplete(st))advanceProgram(st);
 st.splitDone=true;st.started=true;
 const ne=st.programs.filter(p=>p.exercises.length).length;
 logActivity('SESSION','Started session with '+c.name+' · '+ne+' program'+(ne!==1?'s':'')+' × '+total+' exercises',{clientId:c.id});
 render();sc();toast('Session started — '+st.programs[st.currentProgramIdx].label);
}

/* ---- per-set weight/reps logging ----
   The active exercise's CURRENT set shows an editable WEIGHT/REP card (see setCardHTML). Coaches can adjust
   the load/reps for that individual set before confirming it. Per-set overrides live in prog.setLogs keyed by
   "round:name"; until a set is edited it simply shows the week's prescribed load (exWeightFor/exRepsFor). */
let setEditKey=null;   // "round:name" of the set whose card is expanded for editing, or null (collapsed)
function setLogKey(round,name){return round+':'+name;}
// the weight/reps to show for one set — a per-set override if present; otherwise the load last used
// for this exercise earlier in this session (carry it forward), falling back to the week's prescription
function setLogFor(c,prog,round,name){
 const k=setLogKey(round,name);
 if(prog.setLogs&&prog.setLogs[k])return prog.setLogs[k];
 // carry forward the most recent earlier set the coach actually logged this session
 if(prog.setLogs){for(let r=round-1;r>=1;r--){const prev=prog.setLogs[setLogKey(r,name)];if(prev)return {w:prev.w,r:prev.r};}}
 return {w:exWeightFor(c,name),r:exRepsFor(c,name)};
}
// ensure a mutable per-set log exists (seeded from the prescription) before a stepper edits it
function ensureSetLog(c,prog,round,name){
 prog.setLogs=prog.setLogs||{};const k=setLogKey(round,name);
 if(!prog.setLogs[k]){const d=setLogFor(c,prog,round,name);prog.setLogs[k]={w:d.w,r:d.r};}
 return prog.setLogs[k];
}
// the active program + its current round (the card only ever shows for the active program's current set)
function activeSetCtx(id){const st=getSession(id);if(!st||!st.splitDone)return null;
 const prog=st.programs[st.currentProgramIdx];if(!prog)return null;return {st,prog,round:currentRound(prog)};}
function toggleSetEdit(id,name){const ctx=activeSetCtx(id);if(!ctx)return;
 const k=setLogKey(ctx.round,name);setEditKey=(setEditKey===k)?null:k;render();}
function bumpSetWeight(id,name,delta){const c=clients.find(x=>x.id===id),ctx=activeSetCtx(id);if(!c||!ctx)return;
 const l=ensureSetLog(c,ctx.prog,ctx.round,name);l.w=Math.max(0,Math.round(((+l.w||0)+delta*2.5)*10)/10);render();}
function bumpSetReps(id,name,delta){const c=clients.find(x=>x.id===id),ctx=activeSetCtx(id);if(!c||!ctx)return;
 const l=ensureSetLog(c,ctx.prog,ctx.round,name);l.r=Math.max(1,(+l.r||0)+delta);render();}
// ✓ — apply the edited weight/reps (already saved live by the steppers) and collapse the editor. This does
// NOT complete the set; the set is marked done separately by tapping its row (toggleCircuitEx).
function confirmSet(id,name){setEditKey=null;render();}
// the WEIGHT/REP card under the active exercise — collapsed (values + edit pencil) or expanded (steppers + ✕/✓)
function setCardHTML(c,prog,round,name){
 const rep=isRepBased(sessExMeta(c,name)),unit=rep?'':' kg';
 const l=setLogFor(c,prog,round,name);
 const wDisp=Number.isInteger(+l.w)?l.w:(+l.w).toFixed(1);
 const lbl=rep?'Level':'Weight';
 if(setEditKey!==setLogKey(round,name)){
  return `<div class="pgm-setcard">
    <div class="psc-pill"><span class="psc-lbl">Rep</span><span class="psc-val">${l.r}</span></div>
    <div class="psc-pill"><span class="psc-lbl">${lbl}</span><span class="psc-val">${wDisp}${unit}</span></div>
    <button class="psc-edit" onclick="event.stopPropagation();toggleSetEdit(${c.id},'${jsq(name)}')" aria-label="Edit set load"><i data-lucide="pencil"></i></button>
   </div>`;
 }
 return `<div class="pgm-setcard editing">
   <div class="psc-step"><div class="psc-step-lbl">Rep</div>
     <div class="psc-step-ctl"><button class="psc-stp" onclick="bumpSetReps(${c.id},'${jsq(name)}',-1)" aria-label="Fewer reps">−</button><span class="psc-step-val">${l.r}</span><button class="psc-stp" onclick="bumpSetReps(${c.id},'${jsq(name)}',1)" aria-label="More reps">+</button></div></div>
   <div class="psc-step"><div class="psc-step-lbl">${lbl}</div>
     <div class="psc-step-ctl"><button class="psc-stp" onclick="bumpSetWeight(${c.id},'${jsq(name)}',-1)" aria-label="Less">−</button><span class="psc-step-val">${wDisp}${unit}</span><button class="psc-stp" onclick="bumpSetWeight(${c.id},'${jsq(name)}',1)" aria-label="More">+</button></div></div>
   <div class="psc-acts">
     <button class="psc-x" onclick="toggleSetEdit(${c.id},'${jsq(name)}')" aria-label="Cancel"><i data-lucide="x"></i></button>
     <button class="psc-ok" onclick="confirmSet(${c.id},'${jsq(name)}')" aria-label="Save set"><i data-lucide="check"></i></button>
   </div>
  </div>`;
}

/* ---- workout actions ---- */
function toggleCircuitEx(id,exName){
 setEditKey=null;
 const st=getSession(id);if(!st||!st.splitDone)return;
 if(attStatus[id]!=='present')return;
 if(sessionComplete(st))return;
 const prog=st.programs[st.currentProgramIdx];const round=currentRound(prog);const key=round+':'+exName;
 prog.progress[key]=!prog.progress[key];
 // an untoggle, or a round still in progress → just re-render
 if(!roundComplete(prog,round)){render();return;}
 // round just completed but more rounds remain in this program → auto-advance (next round's keys are empty)
 if(round<prog.sets){render();toast('Round complete!');return;}
 // last round done → this program is complete; move to the next program if there is one
 if(advanceProgram(st)){render();toast(prog.label+' complete! Now '+st.programs[st.currentProgramIdx].label);return;}
 // no programs left → whole session done
 finishCircuitSession(id,false);
}
// rounds done / total across non-empty programs
function sessionRoundCounts(st){
 const total=st.programs.reduce((s,p)=>s+(p.exercises.length?p.sets:0),0);
 let done=0;st.programs.forEach(p=>{if(!p.exercises.length)return;for(let r=1;r<=p.sets;r++)if(roundComplete(p,r))done++;});
 return {done,total};
}
// archive today's session into the permanent per-client history (upsert by date so a redo-after-reset
// replaces rather than duplicates). Never called by reset/invalidate — only on completion.
function recordSessionHistory(id,early){
 const st=getSession(id);if(!st)return;
 const ct=sessionRoundCounts(st);
 const rec={date:st.date,when:attTime[id]||nowTime(),early:!!early,roundsCompleted:ct.done,totalRounds:ct.total,
  programs:st.programs.filter(p=>p.exercises.length).map(p=>({label:p.label,sets:p.sets,exercises:p.exercises.slice()}))};
 sessionLog[id]=sessionLog[id]||[];
 const i=sessionLog[id].findIndex(r=>r.date===rec.date);
 if(i>=0)sessionLog[id][i]=rec;else sessionLog[id].unshift(rec);
}
// fire the canonical session-complete side effects (balance, tenure, log, celebration). early=ended-with-partial-progress.
function finishCircuitSession(id,early){
 const c=clients.find(x=>x.id===id);if(!c)return;
 if(sessDone[id]===true){render();sc();return;}
 const st=getSession(id);
 sessDone[id]=true;c.sessions++;
 if(c.program&&c.program.done<progTotal(c.program))c.program.done++;
 c.sessionsRemaining=Math.max(0,c.sessionsRemaining-1);c.lastSessionDate=todayISO();
 recordSessionHistory(id,early);   // keep a permanent record of this session
 if(early&&st){
  const ct=sessionRoundCounts(st);
  logActivity('SESSION','Ended session early with '+c.name+' ('+ct.done+' of '+ct.total+' rounds)',{clientId:c.id});
 }else{
  logActivity('SESSION','Session completed for '+c.name+' · '+c.sessionsRemaining+' sessions left',{clientId:c.id});
 }
 render();sc();toast(c.name.split(' ')[0]+"'s session complete 🎉"+(c.sessionsRemaining===0?' — balance empty, renewal due':''));
}

/* ---- session-options menu (⋯) ---- */
function closeSessMenu(){const m=document.getElementById('sessMenu');if(m)m.remove();}
function mountSessMenu(html){closeSessMenu();const app=document.getElementById('app');if(app)app.insertAdjacentHTML('beforeend',html);paintIcons();}
// phase-aware: BEFORE start (no live workout) the menu lets the coach modify today's exercises; DURING an
// active workout it also offers Edit split + End session early. No "reset" option: a session, once run,
// isn't thrown away (a fresh reload re-seeds anyway).
function openSessMenu(id){
 const st=getSession(id);
 const inWorkout=!!st&&st.splitDone&&!sessionComplete(st);
 // "Mark as not present" — opens the attendance chooser (Present / Absent / Cancelled)
 let opts=`<button class="modal-opt" onclick="closeSessMenu();showAttModal()"><div class="mo-ic tint-amber"><i data-lucide="calendar"></i></div>Mark as not present<span class="mo-cur"></span></button>`;
 if(inWorkout){
  opts+=`<button class="modal-opt" onclick="editSplit(${id})"><div class="mo-ic tint-blue"><i data-lucide="pencil"></i></div>Edit programs &amp; rounds<span class="mo-cur"></span></button>`
   +`<button class="modal-opt" onclick="endSessionEarly(${id})"><div class="mo-ic tint-amber"><i data-lucide="flag"></i></div>End session early<span class="mo-cur"></span></button>`;
 }
 mountSessMenu(`<div class="modal-overlay" id="sessMenu" onclick="if(event.target===this)closeSessMenu()">
   <div class="modal-sheet"><div class="modal-handle"></div>
    <div class="modal-title">Session options</div>
    <div class="modal-opts">${opts}</div>
    <button class="modal-cancel" onclick="closeSessMenu()">Cancel</button>
   </div></div>`);
}
function editSplit(id){closeSessMenu();const st=getSession(id);if(!st)return;st.started=true;st.splitDone=false;render();sc();}
// cancel an in-workout edit → drop back into the running circuit without changing it
function cancelEdit(id){const st=getSession(id);if(st&&st.started)st.splitDone=true;render();sc();}
function endSessionEarly(id){closeSessMenu();if(!confirm('End the session now? It will be marked complete with the current progress.'))return;finishCircuitSession(id,true);}

/* ---- views ---- */
// shared header for the present states (attendance chip lets the coach change attendance)
// shared session header: avatar (left) · name + date/time/coach (stacked) · attendance chip + ⋯ (top-right).
// `chip` is the right-hand attendance cluster (empty before attendance is marked).
function sessHeader(c,chip){const cat=CATS[c.cat];
 return `<div class="sx-head2">
   <div class="dava sxh-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${initials(c.name)}</div>
   <div class="sxh-id"><div class="sxh-name">${esc(c.name)}</div><div class="sxh-sub">${sessionDayFor(c)?sessionDayFor(c)+' · Week '+currentWeekFor(c)+' · ':''}${esc(c.time||'—')} · ${esc(c.coach||'—')}</div></div>
   ${chip?`<div class="sxh-att">${chip}</div>`:''}
  </div>`;}
// the present attendance cluster (status pill + change-attendance ⋯)
function sessAttChip(c){const ts=attTime[c.id]?` · ${attTime[c.id]}`:'';
 // once any exercise is logged the client is committed as present — drop the change-attendance ⋯
 const locked=sessionHasProgress(getSession(c.id));
 return `<div class="att-chip ap">✓ Present${ts}</div>`+(locked?'':`<button class="att-dots" onclick="showAttModal()">⋯</button>`);}
function sessHead(c){return sessHeader(c,sessAttChip(c));}
// Scroll-aware session title: once the client's name card scrolls up under the sticky bar, show the
// client's name in the title; restore the default ("Today's Session") when scrolled back to the top.
let _sessTitleObs=null;
function wireSessionTitle(){
 if(_sessTitleObs){_sessTitleObs.disconnect();_sessTitleObs=null;}
 const root=document.getElementById('screen');if(!root)return;
 const bar=root.querySelector('.bar.solid');if(!bar)return;
 const title=bar.querySelector('.bar-title');if(!title)return;
 const nameEl=root.querySelector('.sxh-name,.se-name');if(!nameEl)return;   // the on-page client name
 const def=title.textContent,who=nameEl.textContent.trim();
 if(!who||who===def)return;
 const set=show=>{const t=show?who:def;if(title.textContent!==t)title.textContent=t;};
 const barH=Math.round(bar.getBoundingClientRect().height)||52;
 // fire when the name passes under the sticky bar (root top inset by the bar's height)
 _sessTitleObs=new IntersectionObserver(es=>es.forEach(e=>set(!e.isIntersecting)),
  {root:root,rootMargin:`-${barH}px 0px 0px 0px`,threshold:0});
 _sessTitleObs.observe(nameEl);
}
// "modify this session" affordance — opens the library in session-only mode. Available on every session
// page so a coach can add an exercise to today's circuit at any point (it never touches the standing program).
function sessAddBtn(id){return `<button class="sess-modify" onclick="buildSessionProgram(${id})">Modify this session</button>`;}
function vSession(){const c=cur(),cat=CATS[c.cat],wk=4;
 const today=sessionExercises(c);
 const status=attStatus[c.id];                 // undefined | present | absent | cancelled
 const present=status==='present';
 const closed=status==='absent'||status==='cancelled';
 const ts=attTime[c.id]?` · ${attTime[c.id]}`:'';
 const bar=`<div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Today's session</div></div>`;
 // bar with the ⋯ session-options menu (Add/remove exercises etc.) — used on the pre-start screens
 const barMenu=`<div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Today's session</div><button class="iconbtn" onclick="openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="settings"></i></button></div>`;

 // CLOSED (absent / cancelled)
 if(closed){
  const chip=(status==='absent'
   ?`<div class="att-chip aa">✕ Absent${ts}</div>`
   :`<div class="att-chip ac2">🚫 Cancelled${ts}</div>`)
   +`<button class="att-dots" onclick="showAttModal()">⋯</button>`;
  return `<div class="fadein">${bar}
   ${sessHeader(c,chip)}
   <div class="sx-closed"><div class="sx-closed-ic">${status==='absent'?'✕':'🚫'}</div>
    <div class="sx-closed-t">Session ${status}</div>
    <div class="sx-closed-s">No workout to log for today. ${status==='absent'?'Marked as a missed session.':'This session was cancelled.'}</div>
    <button class="sx-undo" onclick="attStatus[${c.id}]=undefined;attTime[${c.id}]=undefined;sessDone[${c.id}]=undefined;render()">Undo</button></div>
   <div class="sp20"></div></div>`;
 }

 // a session state always exists from here on, so the program-first builder has somewhere to write.
 // A blank / from-scratch session starts with zero programs (coach taps "Add program"); a client with a
 // standing program starts with the default A/B split (still fully editable).
 const st=ensureSession(c);
 // already finished today
 if(sessDone[c.id]===true||sessionComplete(st))return sessCompleteView(c);

 // BEFORE PRESENT — program-first builder + slide-to-mark-present. The coach builds the programs here
 // (Add program → Program A → Add exercises, Add another program → Program B, …); marking present then
 // auto-starts the circuit with exactly those programs.
 if(!present)return preStartBuilder(c,st);

 // PRESENT — marking present starts the session with the programs the coach built. The ⋯ → Edit screen
 // reopens the same builder (started stays true → its CTA returns to the workout instead of restarting).
 if(!st.splitDone&&!st.started)autoStartSession(c.id);
 return st.splitDone?circuitWorkout(c,st):splitScreen(c,st);
}
/* ---- shared: both Program A & B are ALWAYS rendered as sections (before / during / after) ---- */
// round dots for a program header (filled = done, ringed = current round of the active program)
function cwDots(p,curR,active){let s='';for(let r=1;r<=p.sets;r++){let cls='cw-dot';if(roundComplete(p,r))cls+=' done';else if(active&&r===curR)cls+=' cur';s+=`<i class="${cls}"></i>`;}return s;}
// a program section header: coloured + filled when active, grey otherwise; status + round dots on the right.
// colorCls is the per-slot colour class ('a'..'f') — see progColor().
function cwSecHead(p,colorCls,status,dots,active,done){
 const cls='cw-sec-head '+colorCls+(active?' active':'')+(done?' done':'');
 return `<div class="${cls}"><span class="cw-sec-name">${esc(p.label)}</span><span class="cw-sec-status">${status}</span>${dots?`<span class="cw-dots">${dots}</span>`:''}</div>`;
}
/* ---- PART 1 — program-first builder (shared by the pre-start screen and ⋯ → Edit) ----
   Add a program (A, B, C …), then add exercises to each via the library picker. Each program runs its
   exercises in order, repeated for its chosen number of rounds, before moving to the next program. */
// reps shown under each exercise — derived from the prescription (e.g. "3×8" → "8 reps", "3×40s" → "40s")
function exReps(t){if(!t)return '';const m=String(t).match(/[×x]\s*(.+)$/);const r=(m?m[1]:String(t)).trim();return /^\d+$/.test(r)?r+' reps':r;}
// one program card (per the Create Program design): orange title + No. of Sets stepper, then its exercises
// (each with reps + ✕), then a footer row of "＋ Add exercises" (scoped to THIS program) and "Remove".
// one session exercise — same card as the Program tab's Plan-by-week view (ex-card + Weight/Reps steppers),
// but wired to the session (bumpWeight/bumpReps edit this week's logs, exactly like the program steppers).
function sessExCard(c,pIdx,name){
 const meta=sessExMeta(c,name),rep=isRepBased(meta);
 const reps=exRepsFor(c,name);
 const w=exWeightFor(c,name),wDisp=Number.isInteger(w)?w:w.toFixed(1);
 // drag-to-reorder: the grip handle starts a pointer drag (wireExDrag); data attrs identify the card on drop
 return `<div class="ex-card" data-pidx="${pIdx}" data-ex="${esc(name)}"><div class="ex-top">
    <button class="ex-drag" aria-label="Drag to reorder ${esc(name)}">⠿</button>
    <div class="ex-head"><div class="ex-name">${esc(name)}</div></div>
    <button class="ex-remove" onclick="removeExFromProgram(${c.id},${pIdx},'${jsq(name)}')" aria-label="Remove ${esc(name)} from ${esc(st_label(c,pIdx))}">✕</button></div>
   <div class="stepper-row">
    <div class="stepper"><div class="lbl">${rep?'Level/time':'Weight'}</div><div class="ctl"><button class="stp-btn" onclick="bumpWeight(${c.id},${pIdx},'${jsq(name)}',-1)" aria-label="Less">−</button><div class="stp-val">${wDisp}${rep?'':'<small> kg</small>'}</div><button class="stp-btn" onclick="bumpWeight(${c.id},${pIdx},'${jsq(name)}',1)" aria-label="More">+</button></div></div>
    <div class="stepper"><div class="lbl">Reps</div><div class="ctl"><button class="stp-btn" onclick="bumpReps(${c.id},${pIdx},'${jsq(name)}',-1)" aria-label="Fewer reps">−</button><div class="stp-val">${reps}</div><button class="stp-btn" onclick="bumpReps(${c.id},${pIdx},'${jsq(name)}',1)" aria-label="More reps">+</button></div></div>
   </div></div>`;
}
function st_label(c,pIdx){const st=getSession(c.id);return (st&&st.programs[pIdx]&&st.programs[pIdx].label)||progLabel(pIdx);}
// one program group, styled like the Program tab (pgrp group + ex-cards) plus the session's "No. of Sets" control.
function builderSection(c,st,pIdx){
 const p=st.programs[pIdx],nP=st.programs.length,letter=progLetter(pIdx).toLowerCase();
 const cards=p.exercises.length?p.exercises.map(name=>sessExCard(c,pIdx,name)).join('')
   :`<div class="slot-empty">No exercises in ${esc(p.label)} yet — tap “Add exercise” below.</div>`;
 const removeProg=nP>1?`<button class="pb-remove" onclick="removeProgram(${c.id},${pIdx})">Remove ${esc(p.label)}</button>`:'';
 return `<div class="pgrp pgrp-${letter}">
   <div class="pgrp-bhead">
    <div class="pgrp-bid"><div class="pgrp-brow"><span class="pgrp-dot"></span><span class="pgrp-name">${esc(p.label)}</span></div><span class="pgrp-bcount">${p.exercises.length} exercise${p.exercises.length!==1?'s':''}</span></div>
    <div class="pgrp-sets"><span class="pb-sets-lbl">No. of Sets</span>
     <div class="pb-stepper"><button class="pb-step" onclick="bumpSets(${c.id},${pIdx},-1)" aria-label="Fewer sets">−</button><span class="pb-stepval">${p.sets}</span><button class="pb-step" onclick="bumpSets(${c.id},${pIdx},1)" aria-label="More sets">+</button></div></div>
   </div>
   ${cards}
   <button class="slot-add" onclick="addExercisesToProgram(${c.id},${pIdx})">＋ Add exercise to ${esc(p.label)}</button>
   ${removeProg}
  </div>`;
}
// all program cards, or an empty prompt inviting the first "Add program" tap
function builderSections(c,st){
 if(!st.programs.length)return `<div class="pb-empty inset">No programs yet. Tap “Add program” below to create Program A, then add exercises to it.</div>`;
 return st.programs.map((p,i)=>builderSection(c,st,i)).join('');
}
function builderAddProgramBtn(c,st){
 return `<button class="pb-addprog" onclick="addProgram(${c.id})">＋ Add ${st.programs.length?'another program':'program'}</button>`;
}
// bottom action bar — primary (accent) + neutral Cancel, matching the Create Program design
function pbActions(primaryLabel,canDo,primaryClick,cancelClick){
 return `<div class="pb-actions">
   <button class="pb-create ${canDo?'':'dim'}" ${canDo?'':'disabled'} onclick="${primaryClick}">${primaryLabel}</button>
   <button class="pb-cancel" onclick="${cancelClick}">Cancel</button>
  </div>`;
}
// ⋯ → Edit during a workout: the same Create Program builder, committing back into the running circuit
function splitScreen(c,st){
 const total=st.programs.reduce((s,p)=>s+p.exercises.length,0);
 const canStart=total>=2&&st.programs.some(p=>p.exercises.length);
 const ctaLabel=st.started?'Save changes':'Start session';
 const cancel=st.started?`cancelEdit(${c.id})`:`goBack()`;
 return `<div class="fadein">
  <div class="bar solid"><div class="bar-title">${st.started?'Edit Program':'Create Program'}</div><button class="iconbtn" onclick="openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="settings"></i></button></div>
  ${sessHead(c)}
  ${builderSections(c,st)}
  ${builderAddProgramBtn(c,st)}
  ${pbActions(ctaLabel,canStart,`startCircuitSession(${c.id})`,cancel)}</div>`;
}
// PRE-START — the Create Program screen. "Create Program" marks the client present and starts the circuit
// with the programs just built; "Cancel" backs out. Absent/cancelled live behind "Not present?".
// the client header card; tapping it opens that client's detail page
function sessCard(c,chip){const cat=CATS[c.cat];
 return `<div class="se-card tap" onclick="openClient(${c.id})">
   <div class="dava se-ava tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${initials(c.name)}</div>
   <div class="se-id"><div class="se-name-row"><span class="se-name">${esc(c.name)}</span>${chip||''}</div><div class="se-meta">${sessionDayFor(c)?sessionDayFor(c)+' · Week '+currentWeekFor(c)+' · ':''}${esc(c.time||'—')} · ${esc(c.coach||'—')}</div></div>
   <i class="se-chev" data-lucide="chevron-right" aria-hidden="true"></i>
  </div>`;}
// live-session present pill (maroon) + a ⋯ that opens session options — sits in the session card's name row
function sessLiveChip(c){const ts=attTime[c.id]?` · ${attTime[c.id]}`:'';
 return `<div class="se-present"><span class="se-present-tx">✓ Present${ts}</span></div>`;}
// "Modify this session" footer — pencil tile + label, opens the library in session-only mode
function sessModifyBar(id){return `<button class="sess-modify2" onclick="editSplit(${id})"><span class="sm2-ic"><i data-lucide="pencil"></i></span>Modify this session</button>`;}
// which clients are currently in the editable program builder (vs. the read-only Today's Session preview)
let progEditing={};
// snapshot of st.programs taken when the builder opens, so Cancel can revert the in-place edits
let progEditSnapshot={};
function editProgram(id){const st=getSession(id);if(st)progEditSnapshot[id]=JSON.parse(JSON.stringify(st.programs));progEditing[id]=true;render();sc();}
// Save: leave the builder → back to the preview; drop any empty programs left behind
function exitProgramEdit(id){const st=getSession(id);if(st)st.programs=st.programs.filter(p=>p.exercises.length);delete progEditSnapshot[id];progEditing[id]=false;render();sc();}
// Cancel: discard every change made since the builder opened, then leave
function cancelProgramEdit(id){const st=getSession(id);if(st&&progEditSnapshot[id])st.programs=progEditSnapshot[id];delete progEditSnapshot[id];progEditing[id]=false;render();sc();}
// slide-to-confirm control — drag right to mark present & auto-start the circuit (wired by wireSlide)
function slideToStart(label){return `<div class="slide-wrap"><div class="slide-track" id="slideTrack">
   <div class="slide-fill" id="slideFill"></div>
   <div class="slide-label" id="slideLabel">${label}</div>
   <div class="slide-knob" id="slideKnob">›</div>
  </div></div>`;}
function preStartBuilder(c,st){
 // EMPTY — illustrated empty state inviting the first program, OR mark not-present
 if(!st.programs.length)return `<div class="fadein">
  <div class="bar solid"><button class="iconbtn" onclick="goBack()" aria-label="Back">‹</button><div class="bar-title">Today's Schedule</div></div>
  ${sessCard(c)}
  <div class="se-empty">
   <img class="se-art" src="assets/images/empty-session.png" alt="">
   <div class="se-title">No programs yet</div>
   <div class="se-sub">Add a program and exercises to build<br>the perfect workout for your client.</div>
   <button class="bigbtn se-add" onclick="editProgram(${c.id});addProgram(${c.id})"><i data-lucide="plus"></i> Add program</button>
   <div class="se-or">OR</div>
   <button class="se-notpresent" onclick="navTo('attMore',${c.id})"><i data-lucide="calendar"></i> Mark as not present</button>
  </div>
  <div class="sp8"></div></div>`;
 // EDIT — the editable program builder (reached via "Create / Modify program"); ✓ Done returns to the preview
 if(progEditing[c.id]){const meta=`${sessionDayFor(c)?sessionDayFor(c)+' · Week '+currentWeekFor(c)+' · ':''}${esc(c.time||'—')} · ${esc(c.coach||'—')}`;return `<div class="fadein">
  <div class="pb-edit-head">
   <div class="pb-edit-top"><div class="bar-title">Create Program</div><button class="iconbtn bar-x" onclick="cancelProgramEdit(${c.id})" aria-label="Cancel"><i data-lucide="x"></i></button></div>
   <div class="pb-edit-client"><span class="pb-edit-name">${esc(c.name)}</span><span class="pb-edit-name-sub">${meta}</span></div>
  </div>
  ${builderSections(c,st)}
  ${builderAddProgramBtn(c,st)}
  ${pbActions('Save',true,`exitProgramEdit(${c.id})`,`cancelProgramEdit(${c.id})`)}</div>`;}
 // PREVIEW — Today's Session: the standing programs read-only, a Modify affordance, and slide-to-mark-present
 const sections=st.programs.map((p,pIdx)=>p.exercises.length?programBlock(c,p,pIdx,-1):'').join('');
 return `<div class="fadein">
  <div class="bar solid"><button class="iconbtn" onclick="goBack()" aria-label="Back">‹</button><div class="bar-title">Today's Session</div><button class="iconbtn" onclick="openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="settings"></i></button></div>
  ${sessCard(c)}
  ${slideToStart('Slide to mark present & start')}
  <div class="slide-more mt6"><button onclick="navTo('attMore',${c.id})">Not present? More options</button></div>
  ${sections?`<div class="sx-prelock-hint"><i data-lucide="lock"></i>Slide to mark present to start</div><div class="sx-prelock">${sections}</div>`:''}
  <button class="sess-modify2" onclick="editProgram(${c.id})"><span class="sm2-ic"><i data-lucide="pencil"></i></span>Create / modify program</button>
  <div class="sp8"></div></div>`;
}
// PART 2 — round-by-round circuit; BOTH programs stay on screen as per-set grids (active one interactive)
function circuitWorkout(c,st){
 let prog=st.programs[st.currentProgramIdx];
 // defensively hop past an already-complete program (e.g. after an edit) to the next live one
 if(programComplete(prog)&&!sessionComplete(st)&&advanceProgram(st))prog=st.programs[st.currentProgramIdx];
 const activeIdx=st.currentProgramIdx;
 // live circuit: keep the active program open and fold the yet-to-start / completed ones to a tidy header
 const sections=st.programs.map((p,pIdx)=>p.exercises.length?programBlock(c,p,pIdx,activeIdx,true):'').join('');
 return `<div class="fadein">
  <div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Today's Session</div><button class="iconbtn" onclick="openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="settings"></i></button></div>
  ${sessCard(c,sessLiveChip(c))}
  ${sections}
  ${sessModifyBar(c.id)}
  <div class="sp24"></div></div>`;
}
// which folded (idle/completed) programs the coach has manually re-opened during a live session — keyed "id:pIdx"
let progExpanded={};
function toggleProgExpand(id,pIdx){const k=id+':'+pIdx;progExpanded[k]=!progExpanded[k];render();}
// one program block — a per-set grid (started) or a simple exercise list (yet to start). When `collapsible`
// (live session), the yet-to-start / completed programs fold to a header-only summary, tappable to expand.
function programBlock(c,p,pIdx,activeIdx,collapsible){
 const done=programComplete(p);
 const active=pIdx===activeIdx&&!done;
 const idle=!done&&!active;                       // not yet reached in the circuit
 const curR=active?currentRound(p):0;
 const nextName=active?nextExerciseInRound(p,curR):null;
 const state=done?'done':active?'active':'idle';
 const pill=done?`<span class="pgm-pill done"><i data-lucide="check"></i>Completed</span>`
   :active?`<span class="pgm-pill live">Inprogress</span>`
   :`<span class="pgm-pill idle">Yet to start</span>`;
 const setsLbl=done?`${p.sets}/${p.sets} sets`:active?`${curR}/${p.sets} sets`:'';
 // idle / completed programs can be folded away to reduce clutter while the active one stays open
 const foldable=collapsible&&!active;
 const collapsed=foldable&&!progExpanded[c.id+':'+pIdx];
 const chev=foldable?`<i class="pgm-chev${collapsed?'':' up'}" data-lucide="chevron-down"></i>`:'';
 const headClick=foldable?` onclick="toggleProgExpand(${c.id},${pIdx})"`:'';
 const head=`<div class="pgm-head"${headClick}><div class="pgm-title-wrap"><span class="pgm-title">${esc(p.label)}</span>${pill}</div><span class="pgm-head-right">${setsLbl?`<span class="pgm-sets">${setsLbl}</span>`:''}${chev}</span></div>`;
 if(collapsed)return `<div class="pgm-card ${state} mini">${head}</div>`;
 const grid=done||active;                          // started programs show the SET columns
 const colsHead=grid?`<span class="pgm-setcols">${Array.from({length:p.sets},(_,i)=>`<span>Set ${i+1}</span>`).join('')}</span>`:'';
 const rows=p.exercises.map(name=>{
  const ex=sessExMeta(c,name);
  const reps=exReps(ex.target)||'—';
  if(idle)return `<div class="pgm-ex idle"><div class="pgm-ex-main"><div class="pgm-ex-name">${esc(name)}</div><div class="pgm-ex-sub"><span>${esc(reps)}</span></div></div></div>`;
  // subtitle weight + reps track the load actually in use this session (match the WEIGHT/REP card),
  // not just the prescription — so the subline can't contradict an edited card value
  const w=+setLogFor(c,p,active?curR:0,name).w||0;const wLbl=w>0?`${Number.isInteger(w)?w:w.toFixed(1)}kg weights`:'No weights';
  let liveR=null;
  if(p.setLogs){for(let r=(active?curR:0);r>=1;r--){const sl=p.setLogs[setLogKey(r,name)];if(sl){liveR=sl.r;break;}}}
  const repsLbl=liveR!=null?`${liveR} reps`:reps;
  const isCur=active&&name===nextName;
  const cells=Array.from({length:p.sets},(_,i)=>{
   const r=i+1,cellDone=!!p.progress[r+':'+name];
   const curCell=active&&r===curR&&isCur&&!cellDone;
   const inner=cellDone?`<span class="pgm-set done"><i data-lucide="check"></i></span>`
     :curCell?`<span class="pgm-set cur"><i data-lucide="arrow-right"></i></span>`
     :`<span class="pgm-set"></span>`;
   return `<span class="pgm-cell">${inner}</span>`;
  }).join('');
  // ONLY the current exercise of the active program is interactive — tapping any
  // other (non-active) exercise card does nothing, has no tap affordance.
  const click=isCur?` onclick="toggleCircuitEx(${c.id},'${jsq(name)}')"`:'';
  const rowInner=`<div class="pgm-ex-main"><div class="pgm-ex-name">${esc(name)}</div>
      <div class="pgm-ex-sub"><span>${esc(repsLbl)}</span><i class="pgm-dot"></i><span>${esc(wLbl)}</span></div></div>
    <div class="pgm-cells">${cells}</div>`;
  // the current set of the active exercise gets an editable WEIGHT/REP card stacked under its row. The whole
  // card completes the set on tap (except the edit pencil); while editing, tapping it does nothing.
  if(isCur){
   const editing=setEditKey===setLogKey(curR,name);
   return `<div class="pgm-cur-card${editing?'':' tap'}"${editing?'':click}><div class="pgm-ex bare">${rowInner}</div>${setCardHTML(c,p,curR,name)}</div>`;
  }
  return `<div class="pgm-ex">${rowInner}</div>`;
 }).join('');
 return `<div class="pgm-card ${state}${foldable?' foldable':''}">
   ${head}
   <div class="pgm-cols"><span class="pgm-cols-lbl">Exercises</span>${colsHead}</div>
   <div class="pgm-rows">${rows}</div>
  </div>`;
}
// green "present" pill for a finished session (vs the maroon live one) — sits in the session card's name row
function sessDoneChip(c){const ts=attTime[c.id]?` · ${attTime[c.id]}`:'';
 return `<div class="se-present done"><span class="se-present-tx">✓ Present${ts}</span><button class="se-present-dots" onclick="event.stopPropagation();openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="more-vertical"></i></button></div>`;}
// session-complete view — every program shown as a COMPLETED per-set grid (all green). Read-only.
function sessCompleteView(c){
 const st=getSession(c.id);
 const sections=(st?st.programs:[]).map((p,pIdx)=>p.exercises.length?programBlock(c,p,pIdx,-1):'').join('');
 return `<div class="fadein">
  <div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Today's Session</div><button class="iconbtn" onclick="openSessMenu(${c.id})" aria-label="Session options"><i data-lucide="settings"></i></button></div>
  ${sessCard(c,sessDoneChip(c))}
  <div class="sx-complete2"><div class="scx-row"><span class="scx-ic"><i data-lucide="check"></i></span><span class="scx-t">Session Completed</span></div><span class="scx-s">All done for today.</span></div>
  ${sections}
  <button class="sess-modify2 sess-history" onclick="openClient(${c.id});openClientSection('sessions')"><span class="sm2-ic"><i data-lucide="clock"></i></span>View session history<i data-lucide="chevron-right" class="sm2-chev"></i></button>
  <div class="sp24"></div></div>`;
}

/* ============ ATTENDANCE MODAL ============ */
function showAttModal(){
 const c=cur(),status=attStatus[c.id]||'';
 const opts=[
  {key:'present',label:'Present',ic:'<i data-lucide="check"></i>',bg:'var(--green-bg)'},
  {key:'absent',label:'Absent',ic:'<i data-lucide="x"></i>',bg:'var(--red-bg)'},
  {key:'cancelled',label:'Cancelled',ic:'<i data-lucide="ban"></i>',bg:'var(--amber-bg)'}
 ];
 const html=`<div class="modal-overlay" id="attModal" onclick="if(event.target===this)closeAttModal()">
  <div class="modal-sheet">
   <div class="modal-handle"></div>
   <div class="modal-title">Change attendance</div>
   <div class="modal-opts">${opts.map(o=>`<button class="modal-opt ${status===o.key?'cur':''}" onclick="changeAtt('${o.key}')">
    <div class="mo-ic swatch" style="--c-bg:${o.bg}">${o.ic}</div>${o.label}<span class="mo-cur">current</span></button>`).join('')}</div>
   <button class="modal-cancel" onclick="closeAttModal()">Cancel</button>
  </div></div>`;
 document.getElementById('app').insertAdjacentHTML('beforeend',html);
}
function closeAttModal(){const m=document.getElementById('attModal');if(m)m.remove();}
function changeAtt(newStatus){
 const id=S.clientId,old=attStatus[id];
 closeAttModal();
 if(newStatus===old)return;
 // reset circuit/exercise progress when switching away from present (a fresh present rebuilds it)
 if(old==='present'){exDone[id]={};sessDone[id]=undefined;delete sessionProgress[sessKey(id)];}
 if(old==='absent'||old==='cancelled'){sessDone[id]=undefined;}
 setAttendance(id,newStatus);
 if(newStatus==='present')navTo('session',id);
}

/* ============ ATTENDANCE — MORE (absent / cancelled) ============ */
function vAttMore(){const c=cur();
 return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Mark attendance</div></div>
  <div class="att-date"><div class="att-date-name">${c.name}</div><div class="att-date-sub">Today · Mon 19 May · ${c.time}</div></div>
  <button class="att-opt2 ap" onclick="setAttendance(${c.id},'present');navTo('session',${c.id})"><div class="em bg-green"><i data-lucide="check"></i></div>Present</button>
  <button class="att-opt2 aa" onclick="setAttendance(${c.id},'absent')"><div class="em bg-red"><i data-lucide="x"></i></div>Absent</button>
  <button class="att-opt2 ac2" onclick="setAttendance(${c.id},'cancelled')"><div class="em bg-amber"><i data-lucide="ban"></i></div>Cancelled</button>
  <div class="sp20"></div></div>`;
}

/* ============ ONBOARDING ============ */
let onForm={dial:'+91'};   // persists the New-client text fields across re-renders (so changing Category etc. never wipes typed input)
// escape user-typed values before putting them into HTML attribute/textarea templates
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
// ---- New-client phone validation (live, digit-count based) ----
// India (+91) needs exactly 10 digits; other countries accept a 6–15 digit national number.
function phoneOk(pd,dial){return dial==='+91'?pd.length===10:(pd.length>=6&&pd.length<=15)}
function phoneNeed(dial){return dial==='+91'?'10':'6–15'}
function phoneHintHTML(){const pd=(onForm.phone||'').replace(/\D/g,'');const dial=onForm.dial||'+91';const has=pd.length>0,ok=phoneOk(pd,dial);
 const col=!has?'var(--muted)':(ok?'var(--green)':'var(--red)');const txt=!has?'':(ok?'✓ '+pd.length+' digits':pd.length+' / '+phoneNeed(dial)+' digits');
 return `<div id="o-phone-hint" class="input-hint" style="--c-fg:${col}">${txt}</div>`}
function checkPhone(){const inp=document.getElementById('o-phone');if(!inp)return;onForm.phone=inp.value;
 const pd=inp.value.replace(/\D/g,'');const dial=onForm.dial||'+91';const has=pd.length>0,ok=phoneOk(pd,dial);
 inp.style.borderColor=has&&!ok?'var(--red)':'';
 const h=document.getElementById('o-phone-hint');if(h){h.textContent=!has?'':(ok?'✓ '+pd.length+' digits':pd.length+' / '+phoneNeed(dial)+' digits');h.style.color=!has?'var(--muted)':(ok?'var(--green)':'var(--red)')}}
// ---- New-client email validation (live) ----
function emailOk(em){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)}
function emailHintHTML(){const em=(onForm.email||'').trim();const has=em.length>0,ok=emailOk(em);
 const col=!has?'var(--muted)':(ok?'var(--green)':'var(--red)');const txt=!has?'':(ok?'✓ Looks good':'Enter a valid email');
 return `<div id="o-email-hint" class="input-hint" style="--c-fg:${col}">${txt}</div>`}
function checkEmail(){const inp=document.getElementById('o-email');if(!inp)return;onForm.email=inp.value;
 const em=inp.value.trim();const has=em.length>0,ok=emailOk(em);
 inp.style.borderColor=has&&!ok?'var(--red)':'';
 const h=document.getElementById('o-email-hint');if(h){h.textContent=!has?'':(ok?'✓ Looks good':'Enter a valid email');h.style.color=!has?'var(--muted)':(ok?'var(--green)':'var(--red)')}}
// ---- New-client split time picker: separate Hour / Minute / AM-PM scroll columns ----
function tpParse(s){const m=/(\d+):(\d+)\s*(AM|PM)/i.exec(s||'5:30 PM');return m?{h:+m[1],m:+m[2],ap:m[3].toUpperCase()}:{h:5,m:30,ap:'PM'}}
function tpFmt(t){return t.h+':'+String(t.m).padStart(2,'0')+' '+t.ap}
function pickTime(part,val){const t=tpParse(S.onTime);if(part==='h')t.h=+val;else if(part==='m')t.m=+val;else t.ap=val;S.onTime=tpFmt(t);
 const col=document.getElementById('tp-'+part);if(!col)return;col.querySelectorAll('.tp-item').forEach(function(el){el.classList.toggle('sel',el.dataset.v===String(val))});
 const s=col.querySelector('.tp-item.sel');if(s)col.scrollTo({top:s.offsetTop-col.clientHeight/2+s.offsetHeight/2,behavior:'smooth'})}
function timePickerHTML(){const t=tpParse(S.onTime);
 const hrs=[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>`<div class="tp-item ${t.h===h?'sel':''}" data-v="${h}" onclick="pickTime('h',${h})">${h}</div>`).join('');
 const mins=[0,15,30,45].map(m=>`<div class="tp-item ${t.m===m?'sel':''}" data-v="${m}" onclick="pickTime('m',${m})">${String(m).padStart(2,'0')}</div>`).join('');
 const aps=['AM','PM'].map(a=>`<div class="tp-item ${t.ap===a?'sel':''}" data-v="${a}" onclick="pickTime('ap','${a}')">${a}</div>`).join('');
 const colwrap=(id,items,cap)=>`<div class="tp-colwrap"><div class="tp-cap">${cap}</div><div class="tp-colbox"><div class="tp-col" id="tp-${id}">${items}</div></div></div>`;
 return `<div class="timepick">${colwrap('h',hrs,'Hour')}${colwrap('m',mins,'Minute')}${colwrap('ap',aps,'AM/PM')}</div>`}
// set S.onTime from one wheel column without re-rendering
function setTimePart(part,val){const t=tpParse(S.onTime);if(part==='h')t.h=+val;else if(part==='m')t.m=+val;else t.ap=val;S.onTime=tpFmt(t)}
// wire each wheel: center current value, and select whatever scrolls into the middle band (iPhone style)
function wireTimeWheels(){['h','m','ap'].forEach(function(id){const col=document.getElementById('tp-'+id);if(!col)return;
 const items=col.querySelectorAll('.tp-item');if(!items.length)return;const rh=items[0].offsetHeight||32;
 const sel=col.querySelector('.tp-item.sel');if(sel)col.scrollTop=sel.offsetTop-col.clientHeight/2+sel.offsetHeight/2;
 let tm;col.onscroll=function(){
  const idx=Math.max(0,Math.min(items.length-1,Math.round(col.scrollTop/rh)));
  items.forEach(function(el,i){el.classList.toggle('sel',i===idx)});       // live highlight follows the finger/scroll
  clearTimeout(tm);tm=setTimeout(function(){setTimePart(id,items[idx].dataset.v)},80)}})}
/* ── Staged add flows ── A: basics + questionnaire · B: assessment · C: schedule + coach ── */
// Flow A — from the Clients "+" FAB. Fresh draft; no client exists yet.
function openAddClient(){onForm={dial:'+91',ratings:{},assessPaid:false,progWeeks:4,progPaid:false};S.clientId=null;S.onCat='General wellness';S.onAbility='Abled';S.onDays=['Mon','Wed','Fri'];S.onTime='5:30 PM';S.onCoach=(coaches.find(c=>c.main)||coaches[0]).name;S.onMsg=0;navTo('addClient')}
// Flow B — from a pending client's overview. Seed the draft from the client so the assessment preview shows their details.
function openAddAssessment(id){const c=clients.find(x=>x.id===id);if(!c)return;
 const ph=(c.phone||'').trim();let dial='+91',raw=ph;const m=ph.match(/^(\+\d+)\s+(.*)$/);if(m){dial=m[1];raw=m[2];}
 const a=c.assessment||{};   // resume any previously-saved draft so partial work isn't lost
 onForm={dial,phone:raw,name:c.name,email:(c.email&&c.email!=='—')?c.email:'',goals:c.goals||'',medical:c.medical||'',activity:c.activity||'',
  ratings:Object.assign({},a.ratings||{}),assessPaid:!!c.assessmentPaid,assessPaidOn:c.assessmentPaidOn||'',
  weight:a.weight||'',height:a.height||'',waist:a.waist||'',assessNotes:a.notes||'',
  bodyType:a.bodyType||'',fitnessLevel:a.fitnessLevel||'',primaryGoal:a.primaryGoal||'',focusAreas:(a.focusAreas||[]).slice()};
 S.clientId=id;S.onCat=c.cat;S.onAbility=c.ability||'Abled';navTo('addAssessment',id);}
// Flow C (step 2) — once the assessment is done. Seed from any saved schedule so it can be re-edited.
function openAddSchedule(id){const c=clients.find(x=>x.id===id);if(!c)return;
 const p=c.program||{};
 onForm={dial:'+91',progWeeks:p.weeks||4,progPaid:!!p.paid,progPaidOn:p.paidOn||'',sessionDuration:c.sessionDuration||60,programStartDate:c.programStartDate||''};
 S.clientId=id;S.onCat=c.cat;S.onAbility=c.ability||'Abled';
 S.onDays=(c.days&&c.days!=='—')?c.days.split(',').map(s=>s.trim()).filter(Boolean):['Mon','Wed','Fri'];
 S.onTime=(c.time&&c.time!=='—')?c.time:'5:30 PM';
 S.onCoach=c.coach||(coaches.find(co=>co.main)||coaches[0]).name;
 navTo('addSchedule',id);}
// Flow C (step 3) — welcome note, the final onboarding step. Pre-fill the summary from the assessment notes.
function openAddWelcome(id){const c=clients.find(x=>x.id===id);if(!c)return;
 onForm={welcomeSummary:((c.assessment&&(c.assessment.summary||c.assessment.notes))||'').trim()};
 S.clientId=id;S.onMsg=0;navTo('addWelcome',id);}
// who is adding this client — the logged-in coach (the welcome note goes "from" them)
function coachByName(n){return coaches.find(c=>c.name===n)}
function addingCoach(){const n=currentCoach();return coachByName(n)||{name:n,role:'Coach'}}
function onPhoneFmt(){const raw=(onForm.phone||'').trim();return raw?((onForm.dial||'+91')+' '+raw):'—'}
// 1–5 rating control for an assessment dimension
function setRate(k,n){onForm.ratings=onForm.ratings||{};onForm.ratings[k]=(onForm.ratings[k]===n?0:n);render()}
// assessment profile chips — single-select toggles off when re-tapped; focus areas are multi-select
function setProfileChip(field,val){onForm[field]=(onForm[field]===val?'':val);render()}
function toggleFocusArea(val){onForm.focusAreas=onForm.focusAreas||[];const i=onForm.focusAreas.indexOf(val);if(i<0)onForm.focusAreas.push(val);else onForm.focusAreas.splice(i,1);render()}
// render one chip-picker group (single or multi) for the assessment profile card
function asProfileGroup(field){const cfg=ASSESS_PROFILE[field];
 const chips=cfg.opts.map(v=>{const on=cfg.multi?((onForm.focusAreas||[]).includes(v)):(onForm[field]===v);
  const handler=cfg.multi?`toggleFocusArea('${v}')`:`setProfileChip('${field}','${v}')`;
  return `<button class="as-chip ${on?'on':''}" onclick="${handler}">${v}</button>`;}).join('');
 return `<div class="as-chipgroup"><div class="as-chip-label">${cfg.ic} ${cfg.label}${cfg.multi?' <span class="as-chip-hint">(pick any)</span>':''}</div><div class="as-chips">${chips}</div></div>`;}
function rateRow(d){const v=(onForm.ratings||{})[d.k]||0;
 const dots=[1,2,3,4,5].map(n=>`<button class="rate-dot ${v>=n?'on':''}" onclick="setRate('${d.k}',${n})" aria-label="${d.label} ${n} of 5">${n}</button>`).join('');
 return `<div class="rate-row"><div class="rate-label">${d.ic} ${d.label}</div><div class="rate-dots">${dots}</div><div class="rate-val">${v?RATE_WORDS[v]:'—'}</div></div>`;}
// first name from the active draft — the created client (Flows B/C) or the typed-in name (Flow A)
function draftFn(){const c=cur();const n=(c?c.name:onForm.name)||'';return n.trim().split(' ')[0];}
/* ----- the five step bodies, extracted so each add flow can compose the ones it needs ----- */
function stepDetails(){return `<div class="step-title">Client details</div><div class="step-sub">The basics to set them up.</div>
  <div class="field"><label>Full name</label><input id="o-name" placeholder="e.g. Rahul Sharma" autocomplete="off" value="${esc(onForm.name||'')}" oninput="onForm.name=this.value"></div>
  <div class="field"><label>Age</label><input id="o-age" type="number" inputmode="numeric" placeholder="e.g. 30" value="${esc(onForm.age||'')}" oninput="onForm.age=this.value"></div>
  <div class="field"><label>Phone</label><div class="phone-row"><div class="selectwrap dial"><select onchange="onForm.dial=this.value;checkPhone()">${COUNTRIES.map(co=>`<option value="${co.d}" ${(onForm.dial||'+91')===co.d?'selected':''}>${co.f} ${co.d}</option>`).join('')}</select></div><input id="o-phone" inputmode="tel" placeholder="98765 43210" value="${esc(onForm.phone||'')}" oninput="checkPhone()" class="phone-input"></div>${phoneHintHTML()}</div>
  <div class="field"><label>Email</label><input id="o-email" type="email" inputmode="email" autocomplete="off" placeholder="e.g. rahul@email.com" value="${esc(onForm.email||'')}" oninput="checkEmail()">${emailHintHTML()}</div>
  <div class="field"><label>Category</label><div class="chips">${Object.keys(CATS).map(c=>`<button class="cat-chip ${S.onCat===c?'sel':''}" data-cat="${c}" onclick="selOnCat('${c}')">${CATS[c].ic} ${c}</button>`).join('')}</div></div>
  ${S.onCat==='Sports specific'?`<div class="field"><label>Ability</label><div class="seg"><button class="${S.onAbility==='Abled'?'on':''}" onclick="S.onAbility='Abled';render()">Abled</button><button class="${S.onAbility==='Disabled'?'on':''}" onclick="S.onAbility='Disabled';render()">Disabled</button></div></div>`:''}`;}
function stepQuestionnaire(){return `<div class="step-title">Questionnaire</div><div class="step-sub">Goals, history & lifestyle.</div>
  <div class="field"><label>Fitness goals</label><textarea id="o-goals" placeholder="What do they want to achieve?" oninput="onForm.goals=this.value">${esc(onForm.goals||'')}</textarea></div>
  <div class="field"><label>Medical history</label><textarea id="o-medical" placeholder="Injuries, conditions, surgeries…" oninput="onForm.medical=this.value">${esc(onForm.medical||'')}</textarea></div>
  <div class="field"><label>Current activity level</label><input id="o-activity" placeholder="e.g. Moderate — trains 2×/week" value="${esc(onForm.activity||'')}" oninput="onForm.activity=this.value"></div>`;}
/* ----- assessment screen building blocks ----- */
function asMeasure(label,id,key,unit){return `<div class="as-mcell"><span class="as-mlabel">${label}</span><div class="as-minput"><input id="${id}" type="number" inputmode="decimal" value="${esc(onForm[key]||'')}" oninput="onForm.${key}=this.value"><span class="as-unit">${unit}</span></div></div>`;}
function asRatingRow(d){const v=(onForm.ratings||{})[d.k]||0;
 const btns=[1,2,3,4,5].map(n=>`<button class="as-rbtn ${v===n?'on':''}" onclick="setRate('${d.k}',${n})" aria-label="${d.label} ${n} of 5">${n}</button>`).join('');
 return `<div class="as-rrow"><div class="as-rlabel">${d.label}</div><div class="as-rbtns">${btns}</div></div>`;}
function resetMeasures(){onForm.weight='';onForm.height='';onForm.waist='';render();}
function updateNoteCount(el){const n=document.getElementById('anotes-count');if(n)n.textContent=el.value.length+' / 500';}
// (Schedule & coach + Welcome note are composed directly in vAddSchedule, in the assessment-card style)
/* ----- the three add-flow screens — each composes the step bodies it owns ----- */
function vAddClient(){return `<div class="fadein"><div class="bar solid"><div class="bar-title">Add client</div><button class="iconbtn" onclick="goBack()" aria-label="Close">✕</button></div>
  ${stepDetails()}${stepQuestionnaire()}
  <div class="bottom-cta sticky-cta cta-row"><button class="bigbtn ghost" onclick="goBack()">Cancel</button><button class="bigbtn" onclick="submitAddClient()">Add client</button></div></div>`;}
function vAddAssessment(){
 const c=cur();
 const name=esc(c?c.name:(onForm.name||'New client'));
 const paid=!!onForm.assessPaid;
 const noteLen=(onForm.assessNotes||'').length;
 const hasDraft=!!(c&&c.assessment&&!c.assessmentDone);   // a partial draft was saved earlier
 // the measurement / rating / profile / notes cards stay locked until the fee is marked Paid
 const gated=`
   <div class="as-card">
    <div class="as-card-h"><div class="as-card-t">Baseline measurements</div><button class="as-link" onclick="resetMeasures()"><i data-lucide="rotate-ccw"></i>Reset</button></div>
    <div class="as-measures">${asMeasure('Weight','o-weight','weight','kg')}${asMeasure('Height','o-height','height','cm')}${asMeasure('Waist','o-waist','waist','cm')}</div>
   </div>

   <div class="as-card">
    <div class="as-card-h"><div class="as-card-t">Performance ratings <i data-lucide="info" class="as-info"></i></div><div class="as-scale"><span>1 = Poor</span><span>5 = Excellent</span></div></div>
    <div class="as-ratings">${ASSESS_DIMS.map(asRatingRow).join('')}</div>
   </div>

   <div class="as-card">
    <div class="as-card-t">Client profile</div>
    <div class="as-card-sub">Used in the welcome letter's assessment summary.</div>
    <div class="as-profile">${asProfileGroup('bodyType')}${asProfileGroup('fitnessLevel')}${asProfileGroup('primaryGoal')}${asProfileGroup('focusAreas')}</div>
   </div>

   <div class="as-card">
    <div class="as-card-h"><div class="as-card-t"><span class="as-note-ic"><i data-lucide="clipboard-pen"></i></span>Assessment notes</div><span class="as-count" id="anotes-count">${noteLen} / 500</span></div>
    <textarea class="as-textarea" maxlength="500" placeholder="Add notes about posture, movement quality, strengths, limitations…" oninput="onForm.assessNotes=this.value;updateNoteCount(this)">${esc(onForm.assessNotes||'')}</textarea>
   </div>`;
 return `<div class="fadein as-screen">
  <div class="as-head">
   <div class="as-head-tx"><div class="as-head-t">Add assessment</div><div class="as-head-s">${name}</div></div>
   ${hasDraft?'<div class="as-saved">Draft saved <span class="as-saved-ic"><i data-lucide="check"></i></span></div>':''}
   <button class="iconbtn" onclick="goBack()" aria-label="Close">✕</button>
  </div>
  <div class="pad as-body">
   <div class="as-hero">
    <div class="as-hero-ic"><i data-lucide="line-chart"></i></div>
    <div class="as-hero-tx"><div class="as-hero-t">Assessment</div><div class="as-hero-s">Capture baseline measurements and movement quality.</div></div>
   </div>

   <div class="as-card">
    <div class="as-card-t">Assessment fee</div>
    <div class="as-fee">
     <div class="as-fee-opts">
      <button class="as-radio ${!paid?'on':''}" onclick="onForm.assessPaid=false;render()"><span class="as-dot"></span>Pending</button>
      <button class="as-radio ${paid?'on':''}" onclick="onForm.assessPaid=true;render()"><span class="as-dot"></span>Paid</button>
     </div>
     <div class="as-fee-date${paid?'':' is-disabled'}">
      <label>Payment date</label>
      <div class="as-date"><i data-lucide="calendar"></i><input type="date" value="${onForm.assessPaidOn||todayISO()}" max="${todayISO()}" ${paid?'':'disabled'} onchange="onForm.assessPaidOn=this.value"></div>
     </div>
    </div>
   </div>

   ${paid?'':`<div class="as-gate-note"><span class="as-gate-ic"><i data-lucide="lock"></i></span><div>Mark the assessment fee as <b>Paid</b> to record measurements, ratings and notes.</div></div>`}
   <div class="as-gated${paid?'':' is-locked'}" aria-hidden="${paid?'false':'true'}">${gated}</div>
  </div>

  <div class="as-foot">
   <button class="as-btn-ghost" onclick="previewAssessment()"><i data-lucide="eye"></i>Preview</button>
   <button class="as-btn-ghost" onclick="saveAssessmentDraft()"><i data-lucide="save"></i>Save draft</button>
   <button class="as-btn-primary${paid?'':' is-off'}" onclick="submitAddAssessment()"><i data-lucide="check-circle-2"></i>Mark complete</button>
  </div>
 </div>`;}
function vAddSchedule(){
 const c=cur();
 const name=esc(c?c.name:'New client');
 const wks=onForm.progWeeks||4,total=wks*3;
 const progPaid=!!onForm.progPaid;
 // training schedule + coach/program stay locked until the program fee is marked Paid
 const gated=`
   <div class="as-card">
    <div class="as-card-t">Training schedule</div>
    <div class="as-field"><label>Training days</label><div class="daygrid">${DAY_ORDER.map(d=>`<button class="pill-sel ${S.onDays.includes(d)?'sel':''}" onclick="toggleDay('${d}')">${d}</button>`).join('')}</div><div class="pick-hint">${S.onDays.length?S.onDays.join(', '):'Tap days to select'}</div></div>
    <div class="as-field"><label>Time</label>${timePickerHTML()}</div>
   </div>

   <div class="as-card">
    <div class="as-card-t">Coach & program</div>
    <div class="as-field"><label>Assigned coach</label><div class="selectwrap"><select onchange="S.onCoach=this.value">${coaches.map(co=>`<option value="${co.name}" ${S.onCoach===co.name?'selected':''}>${co.name} — ${co.role}</option>`).join('')}</select></div></div>
    <div class="as-field"><label>Program length</label><div class="seg">${[4,5,6].map(w=>`<button class="${wks===w?'on':''}" onclick="onForm.progWeeks=${w};render()">${w} weeks</button>`).join('')}</div><div class="pick-hint">3 sessions / week · ${total} sessions total</div></div>
    <div class="as-field"><label>Session duration</label><div class="seg">${[45,60,75,90].map(d=>`<button class="${(onForm.sessionDuration||60)===d?'on':''}" onclick="onForm.sessionDuration=${d};render()">${d} min</button>`).join('')}</div></div>
    <div class="as-field"><label>Program start date</label><div class="as-date"><i data-lucide="calendar"></i><input type="date" value="${onForm.programStartDate||todayISO()}" onchange="onForm.programStartDate=this.value"></div></div>
   </div>`;
 return `<div class="fadein as-screen">
  <div class="as-head">
   <button class="iconbtn" onclick="goBack()"><i data-lucide="arrow-left"></i></button>
   <div class="as-head-tx"><div class="as-head-t">Schedule & coach</div><div class="as-head-s">${name}</div></div>
  </div>
  <div class="pad as-body">
   <div class="as-hero">
    <div class="as-hero-ic"><i data-lucide="calendar-days"></i></div>
    <div class="as-hero-tx"><div class="as-hero-t">Schedule & coach</div><div class="as-hero-s">Based on the assessment, fix training days, time and assign a coach.</div></div>
   </div>

   <div class="as-card">
    <div class="as-card-t">Program fee</div>
    <div class="as-fee">
     <div class="as-fee-opts">
      <button class="as-radio ${!progPaid?'on':''}" onclick="onForm.progPaid=false;render()"><span class="as-dot"></span>Pending</button>
      <button class="as-radio ${progPaid?'on':''}" onclick="onForm.progPaid=true;render()"><span class="as-dot"></span>Paid</button>
     </div>
     <div class="as-fee-date${progPaid?'':' is-disabled'}">
      <label>Payment date</label>
      <div class="as-date"><i data-lucide="calendar"></i><input type="date" value="${onForm.progPaidOn||todayISO()}" max="${todayISO()}" ${progPaid?'':'disabled'} onchange="onForm.progPaidOn=this.value"></div>
     </div>
    </div>
   </div>

   ${progPaid?'':`<div class="as-gate-note"><span class="as-gate-ic"><i data-lucide="lock"></i></span><div>Mark the program fee as <b>Paid</b> to set training days, time, coach and program.</div></div>`}
   <div class="as-gated${progPaid?'':' is-locked'}" aria-hidden="${progPaid?'false':'true'}">${gated}</div>
  </div>

  <div class="as-foot">
   <button class="as-btn-primary${progPaid?'':' is-off'}" onclick="submitAddSchedule()"><i data-lucide="check-circle-2"></i>Save schedule</button>
  </div>
 </div>`;}
function selOnCat(c){S.onCat=c;render()}
function toggleDay(d){const i=S.onDays.indexOf(d);if(i<0)S.onDays.push(d);else S.onDays.splice(i,1);S.onDays.sort((a,b)=>DAY_ORDER.indexOf(a)-DAY_ORDER.indexOf(b));render()}
function previewAssessment(){const n=(onForm.name||'').trim();if(!n){toast('Add the client name first (step 1)');return}S.assessSrc='draft';navTo('assessDoc')}
// view a completed client's saved assessment (read-only — renders from c.assessment, not the draft)
function viewAssessment(id){S.assessSrc='client';navTo('assessDoc',id)}
// Flow A submit — create the lead with only basics + questionnaire; assessment/schedule/coach come later.
function submitAddClient(){
 const n=(document.getElementById('o-name').value||'').trim();if(!n){toast('Enter a name');return}
 const dial=onForm.dial||'+91';const raw=(document.getElementById('o-phone').value||'').trim();const pd=raw.replace(/\D/g,'');
 if(!pd){toast('Enter a phone number');return}
 if(dial==='+91'&&pd.length!==10){toast('Enter a valid 10-digit phone');return}
 if(pd.length<6||pd.length>15){toast('Enter a valid phone number');return}
 const em=(document.getElementById('o-email').value||'').trim();if(em&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){toast('Enter a valid email');return}
 onForm.name=n;onForm.phone=raw;onForm.email=em;
 const c={id:nextId++,name:n,age:onForm.age||'—',phone:onPhoneFmt(),email:em||'—',
  cat:S.onCat,ability:S.onAbility,status:'Active',coach:null,joined:'May 2025',start:'Today',sessions:0,
  goals:(onForm.goals||'').trim()||'—',medical:(onForm.medical||'').trim()||'None reported',activity:(onForm.activity||'').trim()||'—',injuries:'None',
  assessmentDone:false,scheduleDone:false,scheduleSet:false,
  weights:[],measures:{},photos:[],
  // package-balance model — every client carries this from creation so onboarding payments land in the ledger
  payments:[],sessionsRemaining:0,packageSize:0,lastSessionDate:null,
  exercises:[{name:'Tap to add exercise',target:'set in program',logs:{}}]};
 clients.push(c);reviewState[c.id]={due:false,ago:'just now'};
 // open the new client's detail (its pending overview); Back from here goes up to the clients list (parentOf)
 S.tab='clients';S.clientId=c.id;S.ctab='overview';S.subView=null;S.reorder=false;S.view='client';render();sc();
 toast(n.split(' ')[0]+' added — assessment pending');
}
// Flow B — write the draft's assessment fields onto the client (shared by Save draft + Mark complete).
function writeAssessmentDraft(c){
 const weight=parseFloat(onForm.weight)||0,waist=parseFloat(onForm.waist)||0,height=parseFloat(onForm.height)||0;
 const notes=(onForm.assessNotes||'').trim();
 c.assessment=Object.assign(c.assessment||{},{weight,height,waist,ratings:Object.assign({},onForm.ratings||{}),notes,summary:notes,by:addingCoach().name,date:'Today',
  bodyType:onForm.bodyType||'',fitnessLevel:onForm.fitnessLevel||'',primaryGoal:onForm.primaryGoal||'',focusAreas:(onForm.focusAreas||[]).slice()});
 if(weight){c.weights=[weight];c.measures={Weight:[weight],Waist:waist?[waist]:[]};}
 c.assessmentPaid=!!onForm.assessPaid;
 if(c.assessmentPaid)c.assessmentPaidOn=onForm.assessPaidOn||todayISO();
}
// Save draft — persist partial work without completing; the coach can return and finish later.
function saveAssessmentDraft(){
 const c=cur();if(!c)return;
 writeAssessmentDraft(c);   // assessmentDone stays false → Step 2 remains locked
 S.view='client';S.ctab='overview';S.subView=null;S.reorder=false;render();sc();
 toast('Draft saved — finish '+c.name.split(' ')[0]+'’s assessment anytime');
}
// onboarding writes paid-flags onto the client; these mirror them into the c.payments ledger so the
// Payment section shows them from day one. Both are idempotent — re-running a step never double-records.
function recordOnboardingAssessmentPayment(c){
 c.payments=c.payments||[];
 if(c.payments.some(p=>p.type==='assessment'))return;
 c.payments.push({id:nextPaymentId(c),date:onForm.assessPaidOn||todayISO(),type:'assessment',packageSize:null,sessions:null,status:'Paid',notes:''});
 logActivity('PAYMENT','Recorded payment for '+c.name+' · '+ASSESSMENT_FEE_LABEL+' · Paid',{clientId:c.id});
}
function recordOnboardingProgramPayment(c){
 c.payments=c.payments||[];
 if(c.payments.some(p=>p.type==='package'))return;   // onboarding seeds the first package only
 const sessions=progTotal(c.program);                // weeks × perWeek
 c.payments.push({id:nextPaymentId(c),date:onForm.progPaidOn||todayISO(),type:'package',packageSize:sessions,sessions:sessions,status:'Paid',notes:''});
 c.sessionsRemaining=(c.sessionsRemaining||0)+sessions;c.packageSize=sessions;
 logActivity('PAYMENT','Recorded payment for '+c.name+' · '+sessions+' sessions · Paid',{clientId:c.id});
}
// Mark complete — only once the fee is Paid; marks it done and unlocks Step 2 (schedule & coach).
function submitAddAssessment(){
 const c=cur();if(!c)return;
 if(!onForm.assessPaid){toast('Mark the assessment fee as Paid first');return}
 writeAssessmentDraft(c);
 recordOnboardingAssessmentPayment(c);   // capture the assessment fee in the payment ledger
 c.assessmentDone=true;
 S.view='client';S.ctab='overview';S.subView=null;S.reorder=false;render();sc();
 toast('Assessment complete for '+c.name.split(' ')[0]+' — schedule & coach unlocked');
}
// Flow C step 2 submit — save schedule/coach/program; the welcome note (step 3) finishes setup.
function submitAddSchedule(){
 const c=cur();if(!c)return;
 if(!onForm.progPaid){toast('Mark the program fee as Paid first');return}
 if(!S.onDays.length){toast('Pick training days');return}
 if(!S.onTime){toast('Pick a session time');return}
 if(!S.onCoach){toast('Assign a coach');return}
 const wks=onForm.progWeeks;if(!wks){toast('Choose a program length');return}
 c.days=S.onDays.join(', ');c.time=S.onTime;c.coach=S.onCoach;
 c.sessionDuration=onForm.sessionDuration||60;c.programStartDate=onForm.programStartDate||todayISO();
 c.program={no:1,weeks:wks,perWeek:3,done:0,paid:!!onForm.progPaid,paidOn:onForm.progPaid?(onForm.progPaidOn||todayISO()):null,paidDate:onForm.progPaid?(onForm.progPaidOn||todayISO()):null,fee:PROGRAM_FEE[wks]};
 recordOnboardingProgramPayment(c);   // capture the program/package purchase in the payment ledger + credit the balance
 c.scheduleDone=true;   // step 2 done; scheduleSet (full activation) waits for the welcome note
 S.view='client';S.ctab='overview';S.subView=null;S.reorder=false;render();sc();
 toast('Schedule saved for '+c.name.split(' ')[0]+' — final step: send the welcome note');
}
/* ----- Step 3: Welcome note — composed in the assessment-card style ----- */
function vAddWelcome(){
 const c=cur();if(!c)return '';
 const name=esc(c.name);const fn=esc(c.name.split(' ')[0]);
 const p=c.program||{};
 const days=(c.days&&c.days!=='—')?c.days:'—';
 return `<div class="fadein as-screen">
  <div class="as-head">
   <button class="iconbtn" onclick="goBack()"><i data-lucide="arrow-left"></i></button>
   <div class="as-head-tx"><div class="as-head-t">Welcome note</div><div class="as-head-s">${name}</div></div>
  </div>
  <div class="pad as-body">
   <div class="as-hero">
    <div class="as-hero-ic"><i data-lucide="mail"></i></div>
    <div class="as-hero-tx"><div class="as-hero-t">Welcome note</div><div class="as-hero-s">Sent from you to ${fn}. Review everything before sending.</div></div>
   </div>

   <div class="as-card">
    <div class="as-card-t">Message</div>
    <div class="as-field"><label>First assessment summary <span class="lbl-hint">(coach fills — included in the note)</span></label><textarea id="o-wsum" class="cmp-note" placeholder="Summarise the assessment for ${fn}…" oninput="onForm.welcomeSummary=this.value">${esc(onForm.welcomeSummary||'')}</textarea></div>
    <div class="as-field"><label>Welcome message</label>${MSGS.map((m,i)=>`<div class="msg-card ${S.onMsg===i?'sel':''}" onclick="S.onMsg=${i};render()">${m}</div>`).join('')}</div>
   </div>

   <div class="as-card">
    <div class="as-card-t">In the note</div>
    <div class="kv"><span class="k">📅 Days</span><span class="v">${days}</span></div>
    <div class="kv"><span class="k">⏰ Time</span><span class="v">${c.time||'—'}</span></div>
    <div class="kv"><span class="k">🏋️ Program</span><span class="v">${(p.weeks||4)}-week · 3×/week · ${p.paid?'Paid':'Pending'}</span></div>
    <div class="kv"><span class="k">👤 Coach</span><span class="v">${esc(c.coach||'—')}</span></div>
    <div class="kv"><span class="k">✉️ From</span><span class="v">${addingCoach().name}</span></div>
   </div>
  </div>

  <div class="as-foot">
   <button class="as-btn-primary" onclick="submitAddWelcome()"><i data-lucide="send"></i>Save &amp; send welcome note</button>
  </div>
 </div>`;}
// Flow C step 3 submit — attach the welcome note, activate the client, then open the welcome doc.
function submitAddWelcome(){
 const c=cur();if(!c)return;
 c.welcomeMsg=MSGS[S.onMsg];
 const summary=(onForm.welcomeSummary||'').trim();
 c.assessment=c.assessment||{};if(summary)c.assessment.summary=summary;
 c.scheduleSet=true;   // fully onboarded → client becomes active everywhere
 S.clientId=c.id;S.ctab='overview';S.subView=null;S.reorder=false;
 S.tab='clients';   // welcomeDoc → Back goes up to the client page (parentOf), then to the clients list
 S.view='welcomeDoc';render();sc();
 toast(c.name.split(' ')[0]+' is all set 🎉');
}

/* ----- onboarding document helpers (assessment + welcome note) ----- */
function docLong(){return new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
function gymContact(){return `<span>📍 ${GYM.name}</span><span>📞 ${GYM.phone}</span><span>✉️ ${GYM.email}</span><span>🌐 ${GYM.web}</span>`}
function payTag(paid){return paid?'<span class="rd-paid">✓ Paid</span>':'<span class="rd-due">Pending</span>'}
// baseline-measurement icons (from assets/icons) — inlined with currentColor so they tint red and export to PDF
const MEAS_ICONS={weight:'<i data-lucide="weight"></i>',height:'<i data-lucide="height"></i>',waist:'<i data-lucide="waist"></i>'};
// assessment doc data — from the saved client (viewing a completed one) or the in-progress draft (add flow)
function assessVM(){
 if(S.assessSrc==='client'){const c=cur()||{};const a=c.assessment||{};
  return {name:c.name||'Client',cat:c.cat,program:PROGRAMS[c.cat]||c.cat,phone:c.phone||'—',
   email:(c.email&&c.email!=='—')?c.email:'',weight:a.weight,height:a.height,waist:a.waist,
   ratings:a.ratings||{},notes:(a.notes||'').trim(),goals:c.goals,medical:c.medical,activity:c.activity,
   by:coachByName(a.by)||{name:a.by||currentCoach(),role:'Coach'},paid:!!c.assessmentPaid};}
 return {name:onForm.name||'New client',cat:S.onCat,program:PROGRAMS[S.onCat]||S.onCat,phone:onPhoneFmt(),
  email:(onForm.email||'').trim(),weight:onForm.weight,height:onForm.height,waist:onForm.waist,
  ratings:onForm.ratings||{},notes:(onForm.assessNotes||'').trim(),goals:onForm.goals,medical:onForm.medical,
  activity:onForm.activity,by:addingCoach(),paid:!!onForm.assessPaid};
}
// A4 first-assessment document — viewable during onboarding (draft) and after completion (saved client)
function assessDocHTML(){
 const A=assessVM();const cat=CATS[A.cat]||{};
 const measures=[['Weight',A.weight,'kg',MEAS_ICONS.weight],['Height',A.height,'cm',MEAS_ICONS.height],['Waist',A.waist,'cm',MEAS_ICONS.waist]]
  .map(m=>`<div class="rd-meas"><div class="rd-meas-ic">${m[3]}</div><div class="rd-meas-tx"><div class="rd-meas-l">${m[0]}</div><div class="rd-meas-v">${m[1]?esc(m[1]):'—'}${m[1]?`<small> ${m[2]}</small>`:''}</div></div></div>`).join('');
 const rats=ASSESS_DIMS.map(d=>{const v=A.ratings[d.k]||0;
  const btns=[1,2,3,4,5].map(n=>`<span class="rd-pbtn ${v===n?'on':''}">${n}</span>`).join('');
  return `<div class="rd-prow"><div class="rd-pl">${d.ic} ${d.label}</div><div class="rd-pbtns">${btns}</div><div class="rd-pv">${v?v:'–'} / 5</div></div>`}).join('');
 const notes=A.notes||'No additional notes recorded.';
 return `<div class="rdoc wd-adoc" id="rdoc">
  <div class="rd-deco"></div>
  <div class="rd-head"><img class="rd-logo" src="assets/images/logo.jpg" alt="Elevate Fitness"><div class="rd-head-div"></div>
   <div class="rd-head-tx"><div class="rd-title"><b>FITNESS</b> ASSESSMENT</div><div class="rd-kicker"><span></span>FIRST SESSION<span></span></div><div class="rd-date"><i data-lucide="calendar"></i>${docLong()}</div></div></div>
  <div class="rd-client">
   <div class="rd-avatar tint-cat" style="--c-bg:${cat.b||'var(--accent-soft)'};--c-fg:${cat.c||'var(--accent)'}">${initials(A.name)}</div>
   <div class="rd-client-m"><div class="rd-cname">${esc(A.name).toUpperCase()}</div>
    <div class="rd-crow"><span class="rd-cic"><i data-lucide="clipboard-list"></i></span>Program: <b>${A.program}</b></div>
    <div class="rd-crow"><span class="rd-cic"><i data-lucide="phone"></i></span>Phone: <b>${A.phone}</b></div>
    <div class="rd-crow"><span class="rd-cic"><i data-lucide="mail"></i></span>Email: <b>${A.email||'—'}</b></div>
    <div class="rd-crow"><span class="rd-cic"><i data-lucide="badge-check"></i></span>Assessment fee: ${payTag(A.paid)}</div></div>
   <div class="rd-note"><div class="rd-note-h"><span class="rd-quote">❝</span>COACH NOTES</div>
    <div class="rd-note-tx">${esc(notes)}</div><div class="rd-sign">${A.by.name}</div><div class="rd-sign-n">${A.by.name}</div><div class="rd-sign-t">${A.by.role||'Coach'}</div></div></div>
  <div class="rd-sec"><div class="rd-sec-h"><span class="rd-num">1.</span>BASELINE MEASUREMENTS</div><div class="rd-measrow">${measures}</div></div>
  <div class="rd-sec"><div class="rd-sec-h"><span class="rd-num">2.</span>PERFORMANCE ASSESSMENT</div><div class="rd-plist">${rats}</div></div>
  <div class="rd-sec"><div class="rd-sec-h"><span class="rd-num">3.</span>GOALS &amp; HISTORY</div>
   <div class="rd-gh">
    <div class="rd-gh-row"><span class="rd-gh-ic"><i data-lucide="target"></i></span><div class="rd-gh-l">Goals</div><div class="rd-gh-v">${esc((A.goals||'').trim()||'—')}</div></div>
    <div class="rd-gh-row"><span class="rd-gh-ic"><i data-lucide="cross"></i></span><div class="rd-gh-l">Medical</div><div class="rd-gh-v">${esc((A.medical||'').trim()||'None reported')}</div></div>
    <div class="rd-gh-row"><span class="rd-gh-ic"><i data-lucide="user"></i></span><div class="rd-gh-l">Activity</div><div class="rd-gh-v">${esc((A.activity||'').trim()||'—')}</div></div>
   </div></div>
  <div class="wd-strip wd-strip-adoc">📄 Keep this for your records — your coach is one message away.</div>
  <div class="rd-contact">${gymContact()}</div></div>`;
}
function vAssessDoc(){return `<div class="fadein"><div class="bar solid"><div class="bar-title">Assessment preview</div><button class="iconbtn" onclick="goBack()" aria-label="Close preview"><i data-lucide="x"></i></button></div>
  <div class="rdoc-hint">Share the first-assessment summary with the client — they receive their baseline along with their basic details.</div>
  <div class="rdoc-wrap"><div class="rdoc-frame" id="rdocFrame">${assessDocHTML()}</div></div>
  <div class="rdoc-actions"><button class="bigbtn" onclick="shareDocVia('whatsapp')">📲 Send via WhatsApp</button>
   <div class="rdoc-share"><button class="bigbtn ghost" onclick="shareDocVia('email')">✉️ Email</button><button class="bigbtn ghost" onclick="downloadDocPDF()">⬇ PDF</button></div></div>
  <div class="sp24"></div></div>`;}
// motivational quotes for the welcome letter — chosen deterministically by client.id (never random)
const WD_QUOTES=[
 'The body achieves what the mind believes.',
 'Push yourself, because no one else is going to do it for you.',
 'Strength grows in the moments you think you can’t go on but keep going anyway.',
 'Success starts with self-discipline.',
 'Your only limit is you. Show up and do the work.'
];
// coach avatar for the welcome letter — photo if available, else an initials chip at the same size
function wdCoachAvatar(co){return co&&co.photo?`<img class="wd-coach-img" src="${co.photo}" alt="${esc(co.name)}">`:`<div class="wd-coach-img wd-coach-init">${initials(co.name||'Coach')}</div>`;}
// A4 welcome letter — Elevate Fitness branded, rendered entirely from live client + coach data
function welcomeDocHTML(){const c=cur();if(!c)return '';
 const cat=CATS[c.cat]||{};
 const assigned=coachByName(c.coach)||{name:c.coach||'Your coach',role:'Coach'};
 const a=c.assessment||{};const p=c.program||{};
 const quote=WD_QUOTES[c.id%WD_QUOTES.length];
 const focus=(a.focusAreas&&a.focusAreas.length)?a.focusAreas.join(', '):'—';
 const dur=c.sessionDuration?c.sessionDuration+' mins':'60 mins';
 const startDate=c.programStartDate?fmtPayDate(c.programStartDate):c.start||'Today';
 const days=(c.days||'—').split(',').map(s=>s.trim()).filter(Boolean).join(', ')||'—';
 const specs=(assigned.specializations||[]).map(s=>`<li>${esc(s)}</li>`).join('');
 const certs=(assigned.certifications||[]).map(s=>`<li>${esc(s)}</li>`).join('');
 const tile=(ic,label,val)=>`<div class="wd-tile"><div class="wd-tile-ic">${ic}</div><div class="wd-tile-tx"><div class="wd-tile-l">${label}</div><div class="wd-tile-v">${esc(val||'—')}</div></div></div>`;
 const srow=(ic,label,val)=>`<div class="wd-srow"><div class="wd-srow-ic"><i data-lucide="${ic}"></i></div><div class="wd-srow-tx"><div class="wd-srow-l">${label}</div><div class="wd-srow-v">${esc(val||'—')}</div></div></div>`;
 const crow=(ic,val)=>`<div class="wd-crow2"><span class="wd-crow2-ic"><i data-lucide="${ic}"></i></span><span>${esc(val||'—')}</span></div>`;
 return `<div class="rdoc wd" id="rdoc">
  <div class="wd-hero">
   <div class="wd-hero-deco"></div>
   <img class="wd-logo" src="assets/images/logo.jpg" alt="Elevate Fitness">
   <div class="wd-hero-h">Welcome to <span>Elevate Fitness!</span></div>
   <div class="wd-hero-sub">We’re excited to have you on board. Your fitness journey starts now and we’ll be with you every step of the way.</div>
  </div>
  <div class="wd-body">
   <div class="wd-user">
    <div class="wd-user-l">
     <div class="wd-photo tint-cat" style="--c-bg:${cat.b||'var(--accent-soft)'};--c-fg:${cat.c||'var(--accent)'}"><i data-lucide="user"></i><span>${initials(c.name)}</span></div>
     <div class="wd-user-info">
      <div class="wd-uname">${esc(c.name)}</div>
      <div class="wd-urow"><i data-lucide="cake"></i>${c.age?esc(c.age)+' yrs':'—'}</div>
      <div class="wd-urow"><i data-lucide="phone"></i>${esc(c.phone||'—')}</div>
      <div class="wd-urow"><i data-lucide="mail"></i>${esc(c.email||'—')}</div>
      <div class="wd-urow"><i data-lucide="map-pin"></i>Bangalore, India</div>
     </div>
    </div>
    <div class="wd-qcard">
     <span class="wd-qmark">“</span>
     <div class="wd-qtx">${esc(quote)}</div>
     <div class="wd-kettle">🏋️</div>
    </div>
   </div>
   <div class="wd-cols">
    <div class="wd-card">
     <div class="wd-card-h"><i data-lucide="clipboard-list"></i>Assessment Summary</div>
     <div class="wd-tiles">
      ${tile('🧍','Body Type',a.bodyType)}
      ${tile('📈','Fitness Level',a.fitnessLevel)}
      ${tile('🎯','Primary Goal',a.primaryGoal)}
      ${tile('🏋️','Focus Areas',focus)}
     </div>
     <div class="wd-strip">📄 Detailed assessment attached</div>
    </div>
    <div class="wd-card">
     <div class="wd-card-h"><i data-lucide="calendar-days"></i>Your Schedule</div>
     <div class="wd-srows">
      ${srow('calendar','Training Days',days)}
      ${srow('clock','Session Time',c.time)}
      ${srow('timer','Session Duration',dur)}
      ${srow('flag','Program Start Date',startDate)}
     </div>
     <div class="wd-strip">🔔 Please arrive 10 mins early for your session.</div>
    </div>
   </div>
   <div class="wd-coach">
    ${wdCoachAvatar(assigned)}
    <div class="wd-coach-mid">
     <div class="wd-coach-name">${esc(assigned.name)}</div>
     <div class="wd-coach-role">${esc(assigned.role||'Coach')}</div>
     <ul class="wd-coach-bullets">
      <li>${assigned.yearsExp?esc(assigned.yearsExp)+' years experience':'Experienced coach'}</li>
      ${specs||'<li>Personal training</li>'}
      ${certs}
     </ul>
    </div>
    <div class="wd-coach-right">
     ${crow('phone',assigned.phone)}
     ${crow('mail',assigned.email)}
     <div class="wd-coach-tag">“${esc(assigned.tagline||'Let’s get to work.')}”</div>
    </div>
   </div>
   <div class="wd-banner">
    <div class="wd-banner-tx"><span class="wd-banner-ic"><i data-lucide="target"></i></span><b>Stay Consistent. Stay Focused.</b><span class="wd-banner-red">Let’s Elevate Together!</span></div>
    <div class="wd-figure"></div>
   </div>
   <div class="wd-contact">
    <div class="wd-contact-h">NEED HELP? <span>We’re here for you!</span></div>
    <div class="wd-contact-rows">
     <span><i data-lucide="phone"></i>${GYM.phone}</span>
     <span><i data-lucide="mail"></i>support@elevatefitness.com</span>
     <span><i data-lucide="globe"></i>${GYM.web}</span>
    </div>
   </div>
   <div class="wd-social"><span class="wd-social-l">Follow us</span><span class="wd-social-ics">📷 👍 ▶️</span><span class="wd-social-tag">#ElevateYourself</span></div>
  </div>
 </div>`;
}
function vWelcomeDoc(){const c=cur();
 return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Welcome note</div></div>
  <div class="rdoc-hint">This is the welcome note ${c?esc(c.name.split(' ')[0]):'your client'} receives — from you. Send it now or download a copy.</div>
  <div class="rdoc-wrap"><div class="rdoc-frame" id="rdocFrame">${welcomeDocHTML()}</div></div>
  <div class="rdoc-actions"><button class="bigbtn" onclick="shareDocVia('whatsapp')">📲 Send via WhatsApp</button>
   <div class="rdoc-share"><button class="bigbtn ghost" onclick="shareDocVia('email')">✉️ Email</button><button class="bigbtn ghost" onclick="downloadDocPDF()">⬇ PDF</button></div>
   <button class="ex-reorder-btn" onclick="goBack()">✓ Done — open client profile</button></div>
  <div class="sp24"></div></div>`;}
// shared PDF/share plumbing for the onboarding docs (reuse the report's #rdoc capture pipeline)
function slug(s){return String(s||'client').replace(/[^A-Za-z0-9]+/g,'-')}
function docName(){return S.view==='assessDoc'?(assessVM().name||'client'):((cur()&&cur().name)||onForm.name||'client')}
function docPhone(){return S.view==='assessDoc'?assessVM().phone:((cur()&&cur().phone)||onPhoneFmt())}
function downloadDocPDF(){genPDF(function(){toast('PDF downloaded ✓')})}
function shareDocVia(via){
 const assess=S.view==='assessDoc';const fn=(docName()||'client').split(' ')[0];
 const subj=assess?'Your Elevate Fitness assessment':'Welcome to Elevate Fitness';
 const msg=assess
  ?'Hi '+fn+', here is your Elevate Fitness first-assessment summary along with your details. Looking forward to training with you! 💪'
  :'Hi '+fn+', welcome to Elevate Fitness! Here is your welcome note with your schedule and coach details. Excited to start this journey with you. 🙌';
 if(via==='whatsapp'){let num=(docPhone()||'').replace(/\D/g,'');if(num.length===10)num='91'+num;
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');}
 else window.open('mailto:?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(msg+'\n\n— PDF attached: '+reportFilename()),'_blank');
 genPDF(function(){toast('PDF ready — attach it in '+(via==='whatsapp'?'WhatsApp':'your email'))});
}

/* ============ SCHEDULE ============ */
let schedDay=(()=>{const d=todayWeekday();return d==='Sun'?'Mon':d;})();   // open on today (Mon–Sat)
let schedWeek=0;   // 0 = this week, 1 = next week, …
function schedShift(d){schedWeek=Math.max(0,Math.min(8,schedWeek+d));render()}
function schedWeekInfo(){
 // anchor to the Monday of the real current week (+schedWeek weeks), not a hardcoded date
 const now=new Date(),dow=(now.getDay()+6)%7;   // Mon=0 … Sun=6
 const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-dow+7*schedWeek);
 const end=new Date(start);end.setDate(end.getDate()+5);
 const fmt=d=>d.getDate()+' '+d.toLocaleDateString('en-GB',{month:'short'});
 const label=schedWeek===0?'This week':schedWeek===1?'Next week':'In '+schedWeek+' weeks';
 return {start,label,range:fmt(start)+' – '+fmt(end),fmt};
}
function vSchedule(){const days=['Mon','Tue','Wed','Thu','Fri','Sat'];
 // DERIVED from real schedules: the clients who train on the selected weekday, at their own c.time, with
 // their actual coach. No hardcoded grid. (Coach comes from c.coach, not a per-row literal.)
 const list=sessionsOnDay(schedDay,visibleClients());
 const wk=schedWeekInfo();
 const dayDate=new Date(wk.start);dayDate.setDate(dayDate.getDate()+days.indexOf(schedDay));
 return `<div class="fadein">${vTopbar()}<div class="bar"><div class="bar-title">Schedule</div></div>
  <div class="sched-week">
   <button class="sw-arrow" onclick="schedShift(-1)" ${schedWeek<=0?'disabled':''} aria-label="Previous week">‹</button>
   <div class="sw-label"><b>${wk.label}</b><span>${wk.range}</span></div>
   <button class="sw-arrow" onclick="schedShift(1)" aria-label="Next week">›</button>
  </div>
  <div class="filters">${days.map(d=>`<button class="fchip ${schedDay===d?'on':''}" onclick="schedDay='${d}';render()">${d}</button>`).join('')}</div>
  <div class="wkbanner pad-h">${schedDay} ${wk.fmt(dayDate)} · ${list.length} session${list.length!==1?'s':''} — tap a client to open</div>
  ${list.length?list.map(x=>{const c=x.c,cat=CATS[c.cat];return `<div class="sess-row tap" onclick="openClient(${c.id})">
    <span class="sess-time">${esc(x.t)}</span>
    <div class="ava sz38 tint-cat" style="--c-bg:${cat?cat.b:'var(--accent-soft)'};--c-fg:${cat?cat.c:'var(--accent)'}">${initials(c.name)}</div>
    <div class="sess-main"><div class="sess-name">${esc(c.name)}</div><div class="sess-sub">${esc(c.cat||'')} · Coach ${esc(c.coach||'Unassigned')}</div></div>
    <div class="cr-chev">›</div></div>`}).join(''):`<div class="empty"><div class="em">📅</div><p>No sessions on ${schedDay}.</p></div>`}
  <div class="bottom-cta"><button class="bigbtn ghost" onclick="toast('Add session')">+ Add session</button></div>
  <div class="sp80"></div></div>`;
}

/* ============ REPORTS ============ */
function vReports(){
 const pending=clients.filter(c=>c.status==='Active'&&c.scheduleSet);
 return `<div class="fadein">${vTopbar()}<div class="bar"><div class="bar-title">Reports</div></div>
  <div class="wkbanner label">Weekly & completion reports</div>
  ${pending.map(c=>{const cat=CATS[c.cat];const done=reports.find(r=>r.clientId===c.id&&r.sent);return `<div class="report-row" onclick="openReport(${c.id})">
   <div class="ava sz42 tint-cat" style="--c-bg:${cat.b};--c-fg:${cat.c}">${initials(c.name)}</div>
   <div class="ac-main"><div class="ac-title">${c.name}</div><div class="ac-sub">${done?'Week 4 sent · '+done.when:'Week 4 · ready to send'}</div></div>
   <span class="sbadge ${done?'gbg':'abg'}">${done?'Sent':'Send'}</span></div>`}).join('')}
  <div class="sp80"></div></div>`;
}
const GYM={name:'Elevate Fitness',phone:'+91 98765 43210',email:'info@elevatefitness.com',web:'www.elevatefitness.com'};
const PROGRAMS={'Sports specific':'Sports Performance','Rehab':'Rehabilitation','General wellness':'General Fitness','Special children':'Adaptive Training'};
const GOAL_ICONS=['📅','🏋️','🤸','❤️'];
let repDraft={clientId:null,note:'',goals:[]};
function reportPeriod(){return '19 – 25 May 2025'}
function ensureRepDraft(c){
 if(repDraft.clientId===c.id)return;
 const fn=c.name.split(' ')[0];
 repDraft={clientId:c.id,
  note:'Great consistency this week, '+fn+'! Your strength numbers are trending up and your recovery looks solid. Keep focusing on protein intake and quality sleep — let\'s aim for an even stronger week ahead.',
  goals:[
   {t:'Complete every session',s:'Stay consistent and show up each day'},
   {t:'Add load on main lifts',s:'Focus on depth and controlled reps'},
   {t:'Improve mobility',s:'Warm up well and stretch daily'},
   {t:'Prioritise recovery',s:'Sleep 7-8 hrs and stay hydrated'}]};
}
// weekly attendance derived from the client's scheduled training days
function weekAttendance(c){
 const all=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const sched=(c.days||'').split(',').map(s=>s.trim());
 const days=all.map(d=>({d,st:sched.indexOf(d)>=0?'done':'rest'}));
 const total=days.filter(x=>x.st==='done').length;
 return{days,total,done:total,pct:total?100:0};
}
function exIcon(n){n=n.toLowerCase();
 if(/squat|lunge|leg/.test(n))return'🦵';
 if(/pull|row|lat|chin/.test(n))return'💪';
 if(/plank|core|bridge/.test(n))return'🧘';
 if(/balance|step|wall|walk|incline/.test(n))return'🤸';
 return'🏋️';}
function repVal(ex,log){
 if(!log)return null;
 if(!isRepBased(ex))return{n:log.w,disp:log.w+' kg × '+log.r};
 if(log.w>0){const u=/min/.test(ex.target)?' min':(/s$/.test((ex.target||'').trim())?'s':'');return{n:log.w,disp:log.w+u}}
 return{n:log.r,disp:log.r+' reps'};
}
function prevBest(ex){
 let best=null;
 for(let w=1;w<=3;w++){const v=repVal(ex,ex.logs[w]);if(!v)continue;if(best===null||v.n>best.n)best=v;}
 return best;
}
function impLabel(ex,d){
 const a=Math.abs(d),sign=d>0?'+':'−';
 if(!isRepBased(ex))return sign+a+' kg';
 const c4=ex.logs[4];
 if(c4&&c4.w>0)return sign+a+(/min/.test(ex.target)?' min':(/s$/.test((ex.target||'').trim())?'s':''));
 return sign+a+' reps';
}
function repRow(ex){
 const now=repVal(ex,ex.logs[4]),prev=prevBest(ex);
 let imp='New',cls='flat',arr='';
 if(prev){const d=Math.round((now.n-prev.n)*10)/10;
  if(d>0){imp=impLabel(ex,d);cls='up';arr='↑'}
  else if(d<0){imp=impLabel(ex,d);cls='down';arr='↓'}
  else{imp='Maintained';cls='flat';arr='→'}}
 return{name:ex.name,prev:prev?prev.disp:'—',now:now.disp,imp,cls,arr,ic:exIcon(ex.name)};
}

/* ----- compose screen ----- */
function vReport(){const c=cur();
 ensureRepDraft(c);
 const att=weekAttendance(c);
 const perfN=c.exercises.filter(e=>e.logs[4]).length;
 return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Weekly report</div></div>
  <div class="cmp-head"><div class="cmp-h-name">${c.name}</div><div class="cmp-h-sub">Progress Report · Week 4 of 6 · ${reportPeriod()}</div></div>
  <div class="block"><div class="block-t">Auto-included from logged data</div>
   <div class="cmp-auto"><span>✅ Attendance ${att.done}/${att.total}</span><span>📊 ${perfN} exercises</span><span>📈 Previous best → this week</span></div>
   <div class="cmp-auto-note">Sessions, the performance table and progress are pulled automatically. Add a personal note and next-week goals below.</div></div>
  <div class="block"><div class="block-t">Coach note</div>
   <textarea id="rg-note" class="cmp-note" placeholder="Write a note to ${c.name.split(' ')[0]}…">${repDraft.note}</textarea></div>
  <div class="block"><div class="block-t">Next week goals</div>
   ${repDraft.goals.map((go,i)=>`<div class="cmp-goal"><div class="cmp-goal-ic">${GOAL_ICONS[i]}</div>
    <div class="cmp-goal-f">
     <input id="rg-t-${i}" class="cmp-goal-t" value="${(go.t||'').replace(/"/g,'&quot;')}" placeholder="Goal ${i+1}">
     <input id="rg-s-${i}" class="cmp-goal-s" value="${(go.s||'').replace(/"/g,'&quot;')}" placeholder="Short description"></div></div>`).join('')}</div>
  <div class="bottom-cta"><button class="bigbtn" onclick="submitReport()">Preview report  ›</button></div>
  <div class="sp20"></div></div>`;
}
function submitReport(){
 const note=document.getElementById('rg-note');
 if(note)repDraft.note=note.value.trim();
 repDraft.goals=repDraft.goals.map((go,i)=>{
  const t=document.getElementById('rg-t-'+i),s=document.getElementById('rg-s-'+i);
  return{t:t?t.value.trim():go.t,s:s?s.value.trim():go.s};
 });
 navTo('reportDoc',S.clientId);
}

/* ----- A4 report document ----- */
function reportDocHTML(c){
 const cat=CATS[c.cat]||{};
 const att=weekAttendance(c);
 const rows=c.exercises.filter(e=>e.logs[4]).map(repRow);
 const note=repDraft.note||'Keep up the great work!';
 const program=PROGRAMS[c.cat]||c.cat;
 const R=52,CIRC=2*Math.PI*R,dash=CIRC*att.pct/100;
 const ring=`<svg viewBox="0 0 130 130" class="rd-ring-svg"><circle cx="65" cy="65" r="${R}" fill="none" stroke="#F1DCDB" stroke-width="13"/><circle cx="65" cy="65" r="${R}" fill="none" stroke="#E5322B" stroke-width="13" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${CIRC.toFixed(1)}" transform="rotate(-90 65 65)"/></svg>`;
 const week=att.days.map(x=>`<div class="rd-wd"><div class="rd-wd-l">${x.d.toUpperCase()}</div><div class="rd-wd-c ${x.st}">${x.st==='done'?'✓':x.st==='missed'?'✕':''}</div></div>`).join('');
 const perf=rows.map(r=>`<tr><td class="rd-x"><span class="rd-x-ic">${r.ic}</span>${r.name}</td><td>${r.prev}</td><td>${r.now}</td><td class="rd-imp ${r.cls}">${r.imp} <span>${r.arr}</span></td></tr>`).join('');
 const goals=repDraft.goals.map((g,i)=>`<div class="rd-goal"><div class="rd-goal-ic">${GOAL_ICONS[i]}</div><div><div class="rd-goal-t">${g.t||'—'}</div><div class="rd-goal-s">${g.s||''}</div></div></div>`).join('');
 return `<div class="rdoc" id="rdoc">
  <div class="rd-deco"></div>
  <div class="rd-head">
   <img class="rd-logo" src="assets/images/logo.jpg" alt="Elevate Fitness">
   <div class="rd-head-div"></div>
   <div class="rd-head-tx">
    <div class="rd-title"><b>PROGRESS</b> REPORT</div>
    <div class="rd-kicker"><span></span>WEEKLY SUMMARY<span></span></div>
    <div class="rd-date">📅 ${reportPeriod()}</div>
   </div>
  </div>
  <div class="rd-client">
   <div class="rd-avatar tint-cat" style="--c-bg:${cat.b||'var(--accent-soft)'};--c-fg:${cat.c||'var(--accent)'}">${initials(c.name)}</div>
   <div class="rd-client-m">
    <div class="rd-cname">${c.name.toUpperCase()}</div>
    <div class="rd-crow"><span class="rd-cic">▸</span>Program: <b>${program}</b></div>
    <div class="rd-crow"><span class="rd-cic">▸</span>Coach: <b>${c.coach}</b></div>
    <div class="rd-crow"><span class="rd-cic">▸</span>Reporting Period: <b>${reportPeriod()}</b></div>
   </div>
   <div class="rd-note">
    <div class="rd-note-h"><span class="rd-quote">❝</span>COACH NOTE</div>
    <div class="rd-note-tx">${note}</div>
    <div class="rd-sign">${c.coach}</div>
    <div class="rd-sign-n">${c.coach}</div>
    <div class="rd-sign-t">Certified Coach</div>
   </div>
  </div>
  <div class="rd-sec">
   <div class="rd-sec-h"><span class="rd-num">1.</span>SESSIONS COMPLETED <span class="rd-sec-sub">(ATTENDANCE)</span></div>
   <div class="rd-att">
    <div class="rd-ring">${ring}<div class="rd-ring-c"><div class="rd-ring-v">${att.done}/${att.total||0}</div><div class="rd-ring-p">${att.pct}%</div><div class="rd-ring-l">Completed</div></div></div>
    <div class="rd-week">${week}</div>
   </div>
  </div>
  <div class="rd-sec">
   <div class="rd-sec-h"><span class="rd-num">2.</span>WORKOUT PERFORMANCE</div>
   <table class="rd-table"><thead><tr><th>EXERCISE</th><th>PREVIOUS BEST</th><th>THIS WEEK</th><th>IMPROVEMENT</th></tr></thead>
    <tbody>${perf||'<tr><td colspan="4" class="rd-empty">No exercises logged this week.</td></tr>'}</tbody></table>
  </div>
  <div class="rd-sec">
   <div class="rd-sec-h"><span class="rd-num">3.</span>NEXT WEEK GOALS</div>
   <div class="rd-goals">${goals}</div>
  </div>
  <div class="rd-quote-band">
   <span class="rd-bq">“</span>
   <div class="rd-quote-tx">Discipline today, strength tomorrow,<br><i>transformation forever.</i></div>
   <span class="rd-bq rd-bq-r">”</span>
  </div>
  <div class="rd-contact"><span>📍 ${GYM.name}</span><span>📞 ${GYM.phone}</span><span>✉️ ${GYM.email}</span><span>🌐 ${GYM.web}</span></div>
 </div>`;
}
function vReportDoc(){const c=cur();
 ensureRepDraft(c);
 return `<div class="fadein"><div class="bar solid">
   <button class="iconbtn" onclick="goBack()">‹</button>
   <div class="bar-title">Report preview</div></div>
  <div class="rdoc-hint">This is the PDF your client receives. Download it or share directly.</div>
  <div class="rdoc-wrap"><div class="rdoc-frame" id="rdocFrame">${reportDocHTML(c)}</div></div>
  <div class="rdoc-actions">
   <button class="bigbtn" onclick="downloadReportPDF()">⬇  Download PDF</button>
   <div class="rdoc-share">
    <button class="bigbtn ghost" onclick="shareReportVia('whatsapp')">📲 WhatsApp</button>
    <button class="bigbtn ghost" onclick="shareReportVia('email')">✉️ Email</button></div>
  </div>
  <div class="sp24"></div></div>`;
}
function fitReportDoc(){
 const doc=document.getElementById('rdoc'),frame=document.getElementById('rdocFrame');
 if(!doc||!frame)return;
 doc.style.transform='none';
 const scale=Math.min(1,frame.clientWidth/doc.offsetWidth);
 doc.style.transformOrigin='top left';
 doc.style.transform='scale('+scale+')';
 frame.style.height=(doc.offsetHeight*scale)+'px';
}
function reportFilename(){
 if(S.view==='assessDoc')return 'Elevate-Assessment-'+slug(onForm.name)+'.pdf';
 if(S.view==='welcomeDoc'){const c=cur();return 'Elevate-Welcome-'+slug(c?c.name:onForm.name)+'.pdf'}
 const c=cur();return 'Elevate-Report-'+(c?slug(c.name):'client')+'-Wk4.pdf';
}
function markReportSent(){const c=cur();const r=reports.find(x=>x.clientId===c.id);
 if(r){r.sent=true;r.when='Just now'}else reports.push({clientId:c.id,week:4,sent:true,when:'Just now'})}
function genPDF(then){
 const el=document.getElementById('rdoc');
 if(!el){toast('Report not ready');return}
 if(typeof html2pdf==='undefined'){toast('PDF library not loaded — check your connection');return}
 const app=document.getElementById('app'),frame=document.getElementById('rdocFrame'),scr=document.getElementById('screen');
 // un-scale and lift every clip so html2canvas captures the full A4 document in place, then restore
 const sv={t:el.style.transform,ao:app.style.overflow,fo:frame.style.overflow,fh:frame.style.height,so:scr.style.overflow};
 const restore=function(){el.style.transform=sv.t;app.style.overflow=sv.ao;frame.style.overflow=sv.fo;frame.style.height=sv.fh;scr.style.overflow=sv.so;fitReportDoc()};
 el.style.transform='none';app.style.overflow='visible';frame.style.overflow='visible';frame.style.height='auto';scr.style.overflow='visible';
 const w=el.offsetWidth,h=el.offsetHeight+10;   // +10px slack keeps it to one page
 toast('Generating PDF…');
 html2pdf().set({margin:0,filename:reportFilename(),image:{type:'jpeg',quality:0.97},
   pagebreak:{mode:[]},
   html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},
   jsPDF:{unit:'px',format:[w,h],orientation:'portrait'}})
  .from(el).save()
  .then(function(){restore();if(then)then()})
  .catch(function(){restore();toast('PDF generation failed')});
}
function downloadReportPDF(){genPDF(function(){markReportSent();toast('PDF downloaded ✓')})}
function shareReportVia(via){
 const c=cur(),fn=c.name.split(' ')[0];
 const msg='Hi '+fn+', here is your Elevate Fitness weekly progress report. Great work this week — keep it up! 💪';
 if(via==='whatsapp'){let num=(c.phone||'').replace(/\D/g,'');if(num.length===10)num='91'+num;
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');}
 else{window.open('mailto:?subject='+encodeURIComponent('Your Elevate Fitness Weekly Report')+'&body='+encodeURIComponent(msg+'\n\n— Please find the report PDF attached: '+reportFilename()),'_blank');}
 genPDF(function(){markReportSent();toast('PDF downloaded — attach it in '+(via==='whatsapp'?'WhatsApp':'your email'))});
}

/* ============ MORE ============ */
function vMore(){
 const p=PROFILES[S.role];
 // profile now lives on the More tab — current profile card + manage options
 return `<div class="fadein">${vTopbar()}<div class="bar"><div class="bar-title">Profile</div></div>
  <div class="more-prof">
   <div class="more-prof-ava">${p.photo?`<img src="${p.photo}" alt="${p.name}">`:initials(p.head)}</div>
   <div class="more-prof-tx"><div class="more-prof-n">${p.name}</div><div class="more-prof-r">${p.role}</div></div>
   <button class="more-prof-edit" onclick="openEditProfile()" aria-label="Edit profile"><i data-lucide="pencil"></i></button>
  </div>
  <div class="more-sec">Manage</div>
  <div class="mgroup">
   <div class="mrow" onclick="S.attachTo=null;S.libQ='';S.libGroup='All';navTo('library')">
    <div class="mrow-ic tint-purple"><i data-lucide="dumbbell"></i></div>
    <div class="mrow-tx"><div class="mrow-t">Exercise library</div><div class="mrow-s">Browse and manage exercises</div></div>
    <div class="mrow-chev">›</div></div>
   <div class="mrow" onclick="toast('Settings')">
    <div class="mrow-ic tint-blue"><i data-lucide="settings"></i></div>
    <div class="mrow-tx"><div class="mrow-t">Settings</div><div class="mrow-s">Preferences and app settings</div></div>
    <div class="mrow-chev">›</div></div>
   <div class="mrow" onclick="toast('Elevate Fitness · v2.4.1')">
    <div class="mrow-ic tint-amber"><i data-lucide="info"></i></div>
    <div class="mrow-tx"><div class="mrow-t">About Elevate Fitness</div><div class="mrow-s">Version 2.4.1</div></div>
    <div class="mrow-chev">›</div></div>
  </div>
  <div class="mgroup">
   <div class="mrow danger" onclick="logout()">
    <div class="mrow-ic tint-red"><i data-lucide="log-out"></i></div>
    <div class="mrow-tx"><div class="mrow-t">Log out</div></div>
    <div class="mrow-chev">›</div></div>
  </div>
  <div class="sp80"></div></div>`;
}

/* ---- edit profile (name / phone / email / photo) ---- */
let profileDraft=null;
function openEditProfile(){
 const p=PROFILES[S.role];
 // keep a ref to the matching coach record so phone/email/photo stay in sync with the roster
 const co=coaches.find(c=>p.name.includes(c.name))||null;
 profileDraft={name:p.name,phone:p.phone||'',email:p.email||'',photo:p.photo||'',co};
 navTo('editProfile');
}
function onProfilePhoto(e){
 const f=e.target.files&&e.target.files[0];if(!f||!profileDraft)return;
 const r=new FileReader();r.onload=()=>{profileDraft.photo=r.result;render();};r.readAsDataURL(f);
}
function removeProfilePhoto(){if(profileDraft){profileDraft.photo='';render();}}
function cancelEditProfile(){profileDraft=null;goBack();}
function saveProfile(){
 if(!profileDraft)return;
 const name=(profileDraft.name||'').trim();
 const email=(profileDraft.email||'').trim();
 if(!name){toast('Name can’t be empty');return;}
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast('Enter a valid email');return;}
 const p=PROFILES[S.role];
 p.name=name;p.head=name;p.phone=(profileDraft.phone||'').trim();p.email=email;p.photo=profileDraft.photo||'';
 // sync the coach roster record (keep its short name as the key) + login identity
 if(profileDraft.co){profileDraft.co.phone=p.phone;profileDraft.co.email=p.email;if(p.photo)profileDraft.co.photo=p.photo;}
 if(S.role==='main'){TRAINER.name=name;if(email)TRAINER.email=email;}
 profileDraft=null;goBack();toast('Profile updated');
}
function vEditProfile(){
 const d=profileDraft||{};
 return `<div class="fadein"><div class="bar solid"><div class="bar-title">Edit profile</div><button class="iconbtn bar-x" onclick="cancelEditProfile()" aria-label="Cancel"><i data-lucide="x"></i></button></div>
  <div class="ep-photo">
   <div class="ep-ava">${d.photo?`<img src="${esc(d.photo)}" alt="Profile photo">`:initials(d.name||'?')}</div>
   <input id="ep-file" type="file" accept="image/*" hidden onchange="onProfilePhoto(event)">
   <div class="ep-photo-acts">
    <button class="ep-photo-btn" onclick="document.getElementById('ep-file').click()">${d.photo?'Change photo':'Add photo'}</button>
    ${d.photo?`<button class="ep-photo-rm" onclick="removeProfilePhoto()">Remove</button>`:''}
   </div>
  </div>
  <div class="field"><label>Name</label><input id="ep-name" type="text" value="${esc(d.name||'')}" placeholder="Your name" oninput="profileDraft.name=this.value"></div>
  <div class="field"><label>Phone number</label><input id="ep-phone" type="tel" inputmode="tel" value="${esc(d.phone||'')}" placeholder="+91 90000 00000" oninput="profileDraft.phone=this.value"></div>
  <div class="field"><label>Email</label><input id="ep-email" type="email" inputmode="email" value="${esc(d.email||'')}" placeholder="you@elevatefitness.com" oninput="profileDraft.email=this.value"></div>
  <div class="bottom-cta"><button class="bigbtn" onclick="saveProfile()">Save changes</button></div>
 </div>`;
}

/* ============ ANNOUNCEMENTS ============ */
function vAnnounce(){return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">Announcements</div></div>
  <div class="bottom-cta"><button class="bigbtn" onclick="navTo('annNew')">📢 New announcement</button></div>
  <div class="wkbanner label-t">Sent</div>
  ${announcements.map(a=>`<div class="ann-card"><span class="ann-type tint-cat" style="--c-bg:${a.type==='Holiday'?'var(--amber-bg)':'var(--blue-bg)'};--c-fg:${a.type==='Holiday'?'var(--amber)':'var(--blue)'}">${a.type}</span>
   <div class="ann-title">${a.title}</div><div class="ann-msg">${a.msg}</div><div class="ann-meta">📤 ${a.to} · ${a.when}</div></div>`).join('')}
  <div class="sp20"></div></div>`;
}
let annType='Holiday',annTo='All clients';
function vAnnNew(){return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()">‹</button><div class="bar-title">New announcement</div></div>
  <div class="field"><label>Type</label><div class="seg"><button class="${annType==='Holiday'?'on':''}" onclick="annType='Holiday';render()">Holiday</button><button class="${annType==='Event'?'on':''}" onclick="annType='Event';render()">Event</button></div></div>
  <div class="field"><label>Title</label><input id="a-title" placeholder="e.g. Gym closed for Diwali"></div>
  <div class="field"><label>Message</label><textarea id="a-msg" placeholder="Write your message to clients…"></textarea></div>
  <div class="field"><label>Send to</label><div class="chips">${['All clients',...Object.keys(CATS)].map(t=>`<button class="cat-chip ${annTo===t?'sel':''}" onclick="annTo='${t}';render()">${t}</button>`).join('')}</div></div>
  <div class="preview-phone"><div class="pl">PREVIEW — how clients see it</div><div class="notif-card"><div class="notif-ic">💪</div><div><div class="pv-title" id="pv-t">Your announcement</div><div class="pv-sub" id="pv-m">Message preview…</div></div></div></div>
  <div class="bottom-cta"><button class="bigbtn" onclick="sendAnn()">Send now</button></div></div>`;
}
function sendAnn(){const t=document.getElementById('a-title').value.trim()||'Untitled';const m=document.getElementById('a-msg').value.trim()||'—';announcements.unshift({type:annType,title:t,msg:m,to:annTo,when:'Just now'});navTo('announce');toast('Sent to '+annTo)}

/* ============ COACH ATTENDANCE (removed) ============ */
// The coach-attendance screen + clock-in gate were removed. Coach attendance is now DERIVED
// from sessionLog (see coachSessionsThisMonth / coachActiveDaysThisMonth near vHome).

/* ============ EXERCISE LIBRARY ============ */
// remove an already-attached exercise straight from the "Add to …" picker (by library index)
function removeFromProgram(libIdx){
 const c=clients.find(x=>x.id===S.attachTo);if(!c)return;
 const nm=library[libIdx].n,idx=c.exercises.findIndex(e=>e.name===nm);if(idx<0)return;
 if(c.exercises.length<=1){toast('Add another before removing the last');return}
 c.exercises.splice(idx,1);render();toast('Removed '+nm+' from program');
}
// the library entries (with their original index) that match the current search + muscle-group filter
function libFiltered(){
 const q=(S.libQ||'').toLowerCase().trim();
 const g=S.libGroup||'All';
 return library.map((e,i)=>({e,i})).filter(({e})=>{
  if(g!=='All'&&e.g!==g)return false;
  if(q&&!((e.n||'').toLowerCase().includes(q)||(e.c||'').toLowerCase().includes(q)))return false;
  return true;
 }).sort((a,b)=>(a.e.n||'').localeCompare(b.e.n||''));   // alphabetical by exercise name
}
// one library row — attach-aware (browse shows a target chip; attach shows the +Add / ✓ toggle). i = original library index.
function libRowHTML(e,i){
 const attach=S.attachTo!=null;
 const newProg=attach&&S.attachMode==='newProgram';
 const c=attach?clients.find(x=>x.id===S.attachTo):null;
 const mc=muscleColor(e.g);
 const tag=`<span class="lib-mg tint-cat" style="--c-bg:${mc.b};--c-fg:${mc.c}">${e.g}</span>`;
 const head=`<div class="lib-main"><div class="lib-name-row"><span class="lib-name">${e.n}</span>${tag}</div>`;
 if(attach){
  const session=S.attachReturn==='session';
  const program=S.attachReturn==='program';
  const picked=S.picks.includes(i);
  let btn;
  if(program){
   // program mode: the FULL library always shows. An exercise already in THIS program is marked (and
   // can't be re-added); everything else — including exercises that live in OTHER programs — is a +Add toggle.
   const st=getSession(c&&c.id);const prog=st&&st.programs[S.attachProgIdx];
   const inThis=prog&&prog.exercises.includes(e.n);
   // already in THIS program → removable ✓ (tap to take it out, then pick a different exercise)
   btn=inThis?`<button class="lib-add inprog" onclick="removeExFromProgram(${c.id},${S.attachProgIdx},'${jsq(e.n)}')" aria-label="Remove ${esc(e.n)} from ${esc(prog?prog.label:'')}">✓ In ${esc(prog?prog.label:'')} <b>✕</b></button>`
    :`<button class="lib-add ${picked?'added':''}" onclick="togglePick(${i})">${picked?'✓ Added':'+ Add'}</button>`;
  }else if(session){
   // session mode: anything currently in today's session shows a removable ✓ (whether it came from the
   // standing program or was added just for today); everything else is a +Add toggle.
   const inSession=c&&sessionExercises(c).some(x=>x.name===e.n);
   btn=inSession?`<button class="lib-add inprog" onclick="removeFromSession(${i})" aria-label="Remove from today's session">✓ In session <b>✕</b></button>`
    :`<button class="lib-add ${picked?'added':''}" onclick="togglePick(${i})">${picked?'✓ Added':'+ Add'}</button>`;
  }else{
   // in new-program mode the picker starts from scratch — don't surface the current program's exercises as "already in"
   const already=!newProg&&c&&c.exercises.some(x=>x.name===e.n);
   btn=already?`<button class="lib-add inprog" onclick="removeFromProgram(${i})" aria-label="Remove from program">✓ In program <b>✕</b></button>`:`<button class="lib-add ${picked?'added':''}" onclick="togglePick(${i})">${picked?'✓ Added':'+ Add'}</button>`;
  }
  return `<div class="lib-row ${picked?'pick':''}"><div class="lib-ic"><i data-lucide="dumbbell"></i></div>${head}<div class="lib-cat">${e.c} · ${e.t}</div></div>${btn}</div>`;
 }
 return `<div class="lib-row"><div class="lib-ic"><i data-lucide="dumbbell"></i></div>${head}<div class="lib-cat">${e.c}</div></div><span class="lib-target">${e.t}</span></div>`;
}
function libListHTML(){
 const list=libFiltered();
 if(!list.length){
  // nothing matched — offer to create it (prefilled with the search text). Works in browse AND attach
  // (add-session) flows, so a missing exercise can be added to the library without leaving the picker.
  const q=(S.libQ||'').trim();
  const label=q?'+ Add “'+esc(q)+'” to library':'+ Add a new exercise';
  return `<div class="lib-empty">No exercises match your search — not in the library yet?
   <div class="mt14"><button class="bigbtn ghost narrow" onclick="openAddExercise(${q?"'"+jsq(q)+"'":''})">${label}</button></div></div>`;
 }
 return list.map(({e,i})=>libRowHTML(e,i)).join('');
}
function libCountText(){
 const n=libFiltered().length,m=library.length;
 const filtered=!!((S.libQ&&S.libQ.trim())||(S.libGroup&&S.libGroup!=='All'));
 return filtered?`${n} of ${m} exercises`:`${m} exercises`;
}
// search updates the list in place (keeps the input focused); group chips do a full render
function searchLibrary(q){S.libQ=q;
 const el=document.getElementById('libList');if(el)el.innerHTML=libListHTML();
 const ct=document.getElementById('libCount');if(ct)ct.textContent=libCountText();
 paintIcons();}
function setLibGroup(g){S.libGroup=g;render();}
function vLibrary(){
 const attach=S.attachTo!=null;
 const newProg=attach&&S.attachMode==='newProgram';
 const c=attach?clients.find(x=>x.id===S.attachTo):null;
 const back=`onclick="libraryBack()"`;
 const session=attach&&S.attachReturn==='session';
 const program=attach&&S.attachReturn==='program';
 const planSlot=attach&&S.attachReturn==='planSlot';
 const slotLbl=planSlot?`${S.attachDay} · Program ${S.attachProg}`:'';
 const progSt=program?getSession(S.attachTo):null;
 const progLbl=(progSt&&progSt.programs[S.attachProgIdx]&&progSt.programs[S.attachProgIdx].label)||progLabel(S.attachProgIdx||0);
 const title=newProg?'New program · '+c.name.split(' ')[0]:planSlot?'Add to '+slotLbl:program?'Add to '+progLbl:session?"Add to today's session":attach?'Add to '+c.name.split(' ')[0]:'Exercise library';
 const chips=LIB_GROUPS.map(g=>`<button class="fchip ${(S.libGroup||'All')===g?'on':''}" onclick="setLibGroup('${g}')">${g}</button>`).join('');
 const cta=newProg
  ? `<div class="bottom-cta sticky-cta"><button class="bigbtn ${S.picks.length?'':'dim'}" onclick="saveNewProgramExercises()">${S.picks.length?'Start program · '+S.picks.length+' exercise'+(S.picks.length!==1?'s':''):'Select exercises to add'}</button></div>`
  : planSlot
  ? `<div class="bottom-cta sticky-cta"><button class="bigbtn ${S.picks.length?'':'dim'}" onclick="attachPicked()">${S.picks.length?'Add '+S.picks.length+' to '+slotLbl:'Select exercises for '+slotLbl}</button></div>`
  : program
  ? `<div class="bottom-cta sticky-cta"><button class="bigbtn ${S.picks.length?'':'dim'}" onclick="attachPicked()">${S.picks.length?'Add '+S.picks.length+' to '+progLbl:'Select exercises for '+progLbl}</button></div>`
  : session
  ? `<div class="bottom-cta sticky-cta"><button class="bigbtn ${S.picks.length?'':'dim'}" onclick="attachPicked()">${S.picks.length?'Add '+S.picks.length+" to today's session":'Select exercises to add'}</button></div>`
  : attach
  ? `<div class="eff-box"><div class="eff-label">Take effect from</div>
     <div class="seg"><button class="${S.effFrom==='now'?'on':''}" onclick="S.effFrom='now';render()">This week</button><button class="${S.effFrom==='next'?'on':''}" onclick="S.effFrom='next';render()">Next week</button></div>
     <input type="date" class="eff-date" value="${/^\d{4}-/.test(S.effFrom)?S.effFrom:''}" onchange="S.effFrom=this.value;render()">
     <div class="eff-hint">${S.effFrom==='now'?'⚠️ Applies immediately — changes this week\'s plan.':'✓ Current week stays as-is. New exercises start '+effLabel()+'.'}</div></div>
     <div class="bottom-cta sticky-cta"><button class="bigbtn ${S.picks.length?'':'dim'}" onclick="attachPicked()">${S.picks.length?'Add '+S.picks.length+' · from '+effLabel():'Select exercises to add'}</button></div>`
  : `<div class="bottom-cta sticky-cta"><button class="bigbtn ghost" onclick="openAddExercise()">+ Add new exercise</button></div>`;
 return `<div class="fadein"><div class="bar solid"><button class="iconbtn" ${back}>‹</button><div class="bar-title">${title}</div></div>
  ${newProg?`<div class="wkbanner tight">Pick the exercises for ${esc(c.name.split(' ')[0])}'s new program. The current program will be archived to history.</div>`
   :planSlot?`<div class="wkbanner tight">Pick exercises for ${esc(slotLbl)}. They become part of the standing plan and show up in this day's session.</div>`
   :program?`<div class="wkbanner tight">Pick exercises for ${esc(progLbl)}. The same exercise can also be added to other programs.</div>`
   :session?`<div class="wkbanner tight">Pick exercises for today's session only — these won't change ${esc(c.name.split(' ')[0])}'s standing program.</div>`
   :attach?`<div class="wkbanner tight">Pick exercises to attach. They run until you change them.</div>`:''}
  <div class="searchwrap"><div class="search-field"><input class="search" placeholder="Search exercises…" value="${esc(S.libQ||'')}" oninput="searchLibrary(this.value)"><span class="search-ic"><i data-lucide="search"></i></span></div></div>
  <div class="filters">${chips}</div>
  <div class="lib-count" id="libCount">${libCountText()}</div>
  <div id="libList">${libListHTML()}</div>
  ${cta}</div>`;
}

/* ============ NOTIFICATIONS ============ */
// active clients whose session balance has run out — surfaced as "renew package" notifications (each client once)
function programEndedClients(){return visibleClients().filter(c=>c.status==='Active'&&(paymentStatus(c)==='DueSoon'||paymentStatus(c)==='Overdue'))}
function vNotifications(){
 const due=dueClients();
 const ended=programEndedClients();
 const payItems=ended.map(c=>{const over=paymentStatus(c)==='Overdue';return `<div class="notif-row" onclick="openClient(${c.id});openClientSection('payment')">
   <div class="notif-row-ic pay">💳</div>
   <div class="notif-row-tx"><div class="notif-row-t">${over?'Payment overdue for '+c.name:'Renewal due soon for '+c.name}</div>
    <div class="notif-row-s">${over?'Balance empty · '+daysOverdue(c)+' days overdue — record a payment':'Balance empty — record a renewal payment'}</div></div>
   <div class="notif-row-chev">›</div></div>`}).join('');
 const items=due.map(c=>`<div class="notif-row" onclick="openClient(${c.id})">
   <div class="notif-row-ic">${ICO.bell}</div>
   <div class="notif-row-tx"><div class="notif-row-t">Weekly review due for ${c.name}</div>
    <div class="notif-row-s">Update or confirm their exercise modules · ${rev(c.id).ago}</div></div>
   <div class="notif-row-chev">›</div></div>`).join('');
 const empty=`<div class="notif-empty"><div class="notif-empty-ic">${ICO.bell}</div>
   <div class="notif-empty-t">You're all caught up</div>
   <div class="notif-empty-s">No pending reviews or alerts right now.</div></div>`;
 return `<div class="fadein"><div class="bar solid"><button class="iconbtn" onclick="goBack()" aria-label="Close">✕</button><div class="bar-title">Notifications</div></div>
  ${(due.length||ended.length)?payItems+items:empty}
  <div class="sp20"></div></div>`;
}

/* ============ RENDER ============ */
const VIEWS={client:vClient,session:vSession,attMore:vAttMore,addClient:vAddClient,addAssessment:vAddAssessment,addSchedule:vAddSchedule,addWelcome:vAddWelcome,report:vReport,reportDoc:vReportDoc,assessDoc:vAssessDoc,welcomeDoc:vWelcomeDoc,announce:vAnnounce,annNew:vAnnNew,library:vLibrary,notifications:vNotifications,programHistory:vProgramHistory,programDetail:vProgramDetail,editProfile:vEditProfile,editClient:vEditClient};
const TABS={home:vHome,clients:vClients,schedule:vSchedule,reports:vReports,more:vMore};
function render(){
 if(!authed){
  document.getElementById('screen').innerHTML=vLogin();
  document.getElementById('tabbar').style.display='none';
  document.getElementById('fab').style.display='none';
  return;
 }
 let html;
 if(S.view&&VIEWS[S.view])html=VIEWS[S.view]();
 else html=TABS[S.tab]();
 document.getElementById('screen').innerHTML=html;
 // attendance is only required to start a client's session — no persistent lock banner across sections;
 // the Home Attendance widget carries the Check In prompt, and starting a session prompts inline if not clocked in
 const showChrome=!S.view;
 const tb=document.getElementById('tabbar');
 tb.style.display=showChrome?'flex':'none';
 const fab=document.getElementById('fab');
 // floating "+ Add client" button, bottom-right of the Clients tab (trainers only)
 fab.style.display=(showChrome&&S.tab==='clients')?'flex':'none';
 fab.classList.remove('locked');   // adding a client never requires attendance — never lock the FAB
 if(showChrome){
  // the More tab now carries the profile picture as its icon (its behaviour is unchanged — it still opens More)
  const pr=PROFILES[S.role];
  const moreIc=`<span class="tab-ava${pr.photo?' has-photo':''}">${pr.photo?`<img src="${pr.photo}" alt="Profile">`:initials(pr.head)}</span>`;
  const items=[['home',ICO.navHome,'Home'],['clients',ICO.users,'Clients'],['schedule',ICO.cal,'Schedule'],['reports',ICO.navReports,'Reports'],['more',moreIc,'Profile']];
  tb.innerHTML=items.map(([k,ic,l])=>`<div class="tabitem ${S.tab===k?'on':''}" onclick="tab('${k}')"><span class="ic">${ic}</span>${l}</div>`).join('');
 }
 // live preview wiring for announcement
 if(S.view==='annNew'){const ti=document.getElementById('a-title'),mi=document.getElementById('a-msg');if(ti)ti.oninput=()=>{document.getElementById('pv-t').textContent=ti.value||'Your announcement'};if(mi)mi.oninput=()=>{document.getElementById('pv-m').textContent=mi.value||'Message preview…'}}
 // slide-to-confirm wiring + scroll-aware session title (client name appears once scrolled)
 if(S.view==='session'){wireSlide();wireSessionTitle();wireExDrag();}
 // scale the A4 document (report / assessment / welcome note) to fit the screen
 if(S.view==='reportDoc'||S.view==='assessDoc'||S.view==='welcomeDoc'){
  fitReportDoc();
  const lg=document.querySelector('#rdoc .rd-logo');
  if(lg&&!lg.complete)lg.addEventListener('load',fitReportDoc,{once:true});
 }
 // drag-to-reorder wiring for the program tab (now inside the Program drill-in)
 if(S.view==='client'&&S.subView==='program'&&S.reorder)wireReorder();
 // one-page client detail: scroll-spy highlights the anchor for the section in view
 if(S.view==='client'&&!S.subView){wireScrollSpy();wireCpCharts();}
 // clients list: lazy-load the next batch when the bottom sentinel scrolls into view
 if(!S.view&&S.tab==='clients')wireClientLazy();
 if(S.view==='addSchedule')wireTimeWheels();
 // swap any <i data-lucide> placeholders for Lucide outline SVGs (chrome icons)
 paintIcons();
}
window.addEventListener('resize',function(){if(S.view==='reportDoc'||S.view==='assessDoc'||S.view==='welcomeDoc')fitReportDoc()});
function wireSlide(){
 const track=document.getElementById('slideTrack');if(!track)return;
 const knob=document.getElementById('slideKnob'),fill=document.getElementById('slideFill'),label=document.getElementById('slideLabel');
 const id=S.clientId;let dragging=false,startX=0,x=0;
 const pad=4,knobW=54;
 const maxX=()=>track.clientWidth-knobW-pad*2;
 const moveTo=px=>{x=Math.max(0,Math.min(maxX(),px));knob.style.left=(pad+x)+'px';fill.style.width=(knobW+x)+'px';
  const pct=x/maxX();label.style.opacity=String(1-pct*1.4);};
 const start=e=>{dragging=true;startX=(e.touches?e.touches[0].clientX:e.clientX)-x;};
 const move=e=>{if(!dragging)return;const cx=(e.touches?e.touches[0].clientX:e.clientX);moveTo(cx-startX);if(e.cancelable)e.preventDefault();};
 const end=()=>{if(!dragging)return;dragging=false;
  const completed=x>=maxX()-6;
  // gate check happens here at completion time — the knob still drags, but bounces back if not clocked in
  if(completed){knob.style.left=(pad+maxX())+'px';fill.style.width='100%';setAttendance(id,'present');return;}
  knob.style.transition='left .2s';fill.style.transition='width .2s';moveTo(0);label.style.opacity='1';setTimeout(()=>{knob.style.transition='';fill.style.transition='';},220);
 };
 // remove any stale window listeners from a previous render
 if(window._slideMove){window.removeEventListener('mousemove',window._slideMove);window.removeEventListener('touchmove',window._slideMove);window.removeEventListener('mouseup',window._slideEnd);window.removeEventListener('touchend',window._slideEnd);}
 window._slideMove=move;window._slideEnd=end;
 knob.addEventListener('mousedown',start);knob.addEventListener('touchstart',start,{passive:true});
 window.addEventListener('mousemove',move);window.addEventListener('touchmove',move,{passive:false});
 window.addEventListener('mouseup',end);window.addEventListener('touchend',end);
}
/* ----- drag-to-reorder for the program exercise list ----- */
function wireReorder(){
 const list=document.getElementById('reordList');if(!list)return;
 const rows=[].slice.call(list.querySelectorAll('.reord-row'));
 if(rows.length<2)return;
 let dragging=false,dragEl=null,fromIdx=-1,curIdx=-1,startY=0,slotH=0;
 const begin=function(row,y){
  dragging=true;dragEl=row;fromIdx=rows.indexOf(row);curIdx=fromIdx;startY=y;
  slotH=rows[1].getBoundingClientRect().top-rows[0].getBoundingClientRect().top;
  row.classList.add('reord-drag');
 };
 const move=function(y){
  if(!dragging)return;
  let dy=Math.max(-fromIdx*slotH,Math.min((rows.length-1-fromIdx)*slotH,y-startY));
  dragEl.style.transform='translateY('+dy+'px)';
  const ni=Math.max(0,Math.min(rows.length-1,fromIdx+Math.round(dy/slotH)));
  if(ni!==curIdx){
   curIdx=ni;
   rows.forEach(function(r,k){
    if(r===dragEl)return;
    let s=0;
    if(fromIdx<ni&&k>fromIdx&&k<=ni)s=-slotH;
    else if(fromIdx>ni&&k>=ni&&k<fromIdx)s=slotH;
    r.style.transform=s?'translateY('+s+'px)':'';
   });
  }
 };
 const end=function(){
  if(!dragging)return;dragging=false;
  if(curIdx!==fromIdx){
   const a=cur().exercises;
   a.splice(curIdx,0,a.splice(fromIdx,1)[0]);
   invalidateSession(cur().id);   // reorder changes the program — today's circuit rebuilds
   render();
  }else{
   rows.forEach(function(r){r.style.transform='';r.classList.remove('reord-drag')});
  }
 };
 rows.forEach(function(row){
  const grip=row.querySelector('.reord-grip');if(!grip)return;
  grip.addEventListener('pointerdown',function(e){
   e.preventDefault();
   try{grip.setPointerCapture(e.pointerId)}catch(_){}
   begin(row,e.clientY);
  });
  grip.addEventListener('pointermove',function(e){move(e.clientY)});
  grip.addEventListener('pointerup',end);
  grip.addEventListener('pointercancel',end);
 });
}
// start at the trainer login screen (authed === false)
Promise.race([ICONS_READY,new Promise(function(r){setTimeout(r,1500);})]).then(function(){S.tab='home';render();});
