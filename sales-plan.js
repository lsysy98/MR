(function () {
  'use strict';
  viewNames.push('salesplan');
  var names = ['성진욱', '김무영', '김태홍', '이승엽', '제성규', '송진영', '이현욱'];
  var clinics = ['늘봄', '온유', '맑은미소', '이음', '바른결', '새빛', '한결', '푸른', '온마음', '연세다온', '서울봄', '바른온', '미소담', '더이음', '참좋은', '연세온빛', '서울다정', '하루', '밝은결', '우리봄'];
  var selected = names.includes(ownerInput.value) ? ownerInput.value : '이승엽';
  var el = function (id) { return document.getElementById(id); };
  var monthRows = new Map();
  var storageKey = 'test-sales-plan-drafts-v3';
  var migrateDrafts = false;
  var previousVersion = 1;
  try { var stored = localStorage.getItem(storageKey); var v2 = localStorage.getItem('test-sales-plan-drafts-v2'); previousVersion = v2 ? 2 : 1; migrateDrafts = !stored; var saved = JSON.parse(stored || v2 || localStorage.getItem('test-sales-plan-drafts-v1') || '{}'); Object.keys(saved).forEach(function (month) { if (Array.isArray(saved[month])) monthRows.set(month,saved[month]); }); } catch (_) {}
  function persist() { try { localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(monthRows))); } catch (_) {} }
  var fixtureMonths = ['2026-10'];
  var reportPlans = new Map();
  var productGroups = ['3제', '3제+클로르', '클로르'];
  function planVisit(value,month) {
    if (!value) return '';
    var last=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
    var day=Math.max(1,Math.min(last,Number(String(value).slice(8,10)) || 1));
    return month+'-'+String(day).padStart(2,'0');
  }
  function productGroup(product) {
    var text = String(product || '');
    var chlor = /클로르|CHX/i.test(text);
    var other = text.replace(/클로르\s*(?:\d+\s*ml)?|CHX/gi, '').replace(/[\s,+·]/g, '');
    return chlor ? (other ? '3제+클로르' : '클로르') : '3제';
  }
  // Fictional clients; amount patterns informed by 410 read-only reports (2026-10-18).
  function monthRandom(owner, month) {
    var seed = 2166136261;
    (owner + '|' + month).split('').forEach(function (char) { seed = Math.imul(seed ^ char.charCodeAt(0),16777619); });
    return function () { seed += 0x6D2B79F5; var value = seed; value = Math.imul(value ^ value >>> 15,value | 1); value ^= value + Math.imul(value ^ value >>> 7,value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
  }
  function monthSettings(owner, month) {
    var random = monthRandom(owner,month);
    var count = 20 + Math.floor(random()*6);
    var target = 500 + Math.floor(random()*151);
    return {count:count,target:target,random:random};
  }
  function planCount(owner, month) { return monthSettings(owner,month).count; }
  function createRows(fixtureMonth, legacy, newOnly, combinedGrowth) {
    return names.flatMap(function (owner, oi) {
      var branches = typeof analyticsOwnerBranches !== 'undefined' ? analyticsOwnerBranches[owner] || [] : [];
      var settings = monthSettings(owner,fixtureMonth);
      var random = settings.random;
      var profiles = [
        [[1,1,1,1,2,2,2,3,3,4], [10,10,20,30,50], [20,30,40,70,100]],
        [[1,1,2,2,3,3,3,4,5,6], [10,20,20,40,50], [20,30,40,60,80]],
        [[1,1,2,2,3,3,4,5,9,10], [10,20,30,40,60], [20,20,30,50,80]]
      ];
      var profile = profiles[legacy ? (oi + Number(fixtureMonth.slice(5))) % profiles.length : Math.floor(random()*profiles.length)];
      var distribution = [];
      [2,0,1].forEach(function (group,index) {
        profile[index].forEach(function (amount) { distribution.push({group:group,amount:amount * 10000}); });
      });
      var allCandidates = typeof salesPlanClients !== 'undefined' ? (salesPlanClients[owner] || []) : [];
      var candidates = allCandidates.filter(function (r) { return !r.existing; });
      if (!legacy) for (var j = candidates.length-1; j>0; j--) { var k = Math.floor(random()*(j+1)); var swap = candidates[j]; candidates[j]=candidates[k]; candidates[k]=swap; }
      var existing = allCandidates.filter(function (r) { return r.existing; });
      if (!legacy && !newOnly) for (var j = existing.length-1; j>0; j--) { var k = Math.floor(random()*(j+1)); var swap=existing[j];existing[j]=existing[k];existing[k]=swap; }
      var newIndex=0, growthIndex=0;
      var growthCount=Math.round(settings.count/3);
      var plans = Array.from({ length: legacy ? 20 : settings.count }, function (_, i) {
        var group = [0,1,0,1,2][(i+oi)%5];
        var pool = distribution.filter(function (r) { return r.group===group; });
        var fixture = legacy ? distribution[(i * 7 + oi * 3 + Number(fixtureMonth.slice(5))) % distribution.length] : pool[Math.floor(random()*pool.length)];
        var isGrowth = !legacy && !newOnly && Math.floor((i+1)*growthCount/settings.count)>Math.floor(i*growthCount/settings.count);
        if (isGrowth && fixture.group===1 && !combinedGrowth) {
          var growthGroup = 0;
          var growthPool = distribution.filter(function (r) { return r.group===growthGroup; });
          fixture = growthPool[Math.floor(random()*growthPool.length)];
        }
        var actual = isGrowth ? existing[growthIndex++] : candidates[newIndex++];
        return { owner: owner, client: actual ? actual.client : clinics[(i + oi * 3) % clinics.length] + '치과의원', branch: actual ? actual.branch : branches[i % (branches.length || 1)] || '지점 미지정', code: actual ? actual.code : 'D' + (oi + 1) + String(i + 1).padStart(3, '0'), type: isGrowth ? '증대' : '신규', product: productGroups[fixture.group], amount: fixture.amount, day: 1 + (i * 3 + oi) % 28, status: ['방문 예정', '재방문', '성공', '방문 예정', '상담 중'][(i + oi) % 5], followup: i % 7 === 6 ? '다음 달 이월' : i % 5 === 1 ? '이번 달 재방문' : '미정', note: '' };
      });
      if (!legacy && !newOnly && !combinedGrowth) plans.forEach(function (r) { if (r.status==='성공') r.status='방문 예정'; });
      if (!legacy) {
        var target = settings.target * 10000;
        var total = plans.reduce(function (sum,r) { return sum+r.amount; },0);
        plans.forEach(function (r) {
          var unit = r.product === '클로르' ? 10000 : 100000;
          var minimum = r.product==='클로르' ? 10000 : r.product==='3제' ? 200000 : 300000;
          r.amount = Math.max(minimum,Math.round(r.amount * target / total / unit) * unit);
        });
        var triples = plans.filter(function (r) { return r.product==='3제'; });
        var combined = plans.filter(function (r) { return r.product==='3제+클로르'; });
        var tripleAverage = triples.reduce(function (sum,r) { return sum+r.amount; },0)/triples.length;
        var combinedAverage = combined.reduce(function (sum,r) { return sum+r.amount; },0)/combined.length;
        while (combinedAverage<=tripleAverage) {
          var highest = triples.reduce(function (a,b) { return a.amount>b.amount ? a : b; });
          var lowest = combined.reduce(function (a,b) { return a.amount<b.amount ? a : b; });
          if (highest.amount>lowest.amount) { var amount=highest.amount; highest.amount=lowest.amount; lowest.amount=amount; }
          else { if (highest.amount>100000) highest.amount-=100000; lowest.amount+=100000; }
          tripleAverage=triples.reduce(function (sum,r) { return sum+r.amount; },0)/triples.length;
          combinedAverage=combined.reduce(function (sum,r) { return sum+r.amount; },0)/combined.length;
        }
      }
      if (!legacy && !newOnly) plans.forEach(function (r) { r.generated=true; });
      return plans;
    });
  }
  function replaceGeneratedPlans(plans, linked) {
    var keys = new Set(linked.filter(function (r) { return r.code; }).map(function (r) { return r.owner+'|'+r.code; }));
    var kept=[];
    names.forEach(function (owner) {
      var own=plans.filter(function (r) { return r.owner===owner; });
      var actual=linked.filter(function (r) { return r.owner===owner; }).reduce(function (sum,r) { return sum+Math.max(0,r.reportAmount); },0);
      var matched=own.filter(function (r) { return r.generated && keys.has(owner+'|'+r.code); }).reduce(function (sum,r) { return sum+r.amount; },0);
      var remaining=own.filter(function (r) { return !keys.has(owner+'|'+r.code); });
      var candidates=remaining.filter(function (r) { return r.generated===true && !r.carriedFrom && r.amount>0; });
      var maxRemove=Math.max(0,remaining.length+linked.filter(function (r) { return r.owner===owner; }).length-20);
      var target=Math.max(0,actual-matched);
      var sums=new Map([[0,[]]]);
      candidates.forEach(function (r,index) {
        Array.from(sums).forEach(function (entry) {
          var sum=entry[0]+r.amount;
          var selection=entry[1].concat(index);
          if (selection.length<=maxRemove && (!sums.has(sum) || sums.get(sum).length>selection.length)) sums.set(sum,selection);
        });
      });
      var best=0;
      sums.forEach(function (_,sum) { if (Math.abs(sum-target)<Math.abs(best-target) || Math.abs(sum-target)===Math.abs(best-target) && sum<best) best=sum; });
      var removed=new Set(sums.get(best).map(function (index) { return candidates[index]; }));
      var ownerRows=linked.filter(function (r) { return r.owner===owner; }).concat(remaining.filter(function (r) { return !removed.has(r); }));
      var successes=ownerRows.filter(function (r) { return r.status==='성공'; });
      var pending=ownerRows.filter(function (r) { return r.status!=='성공'; });
      if (!pending.length) { kept.push.apply(kept,ownerRows); return; }
      var slots=new Set(successes.map(function (_,i) { return Math.floor((i+1)*ownerRows.length/(successes.length+1)); }));
      var successIndex=0, pendingIndex=0;
      ownerRows.forEach(function (_,i) { kept.push(slots.has(i) ? successes[successIndex++] : pending[pendingIndex++]); });
    });
    return kept;
  }
  function rows() {
    var month = el('planMonth').value;
    if (month<'2026-10') return [];
    var currentMonth = new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'}).slice(0,7);
    if (month > currentMonth) return [];
    if (!monthRows.has(month)) {
      var previousDate = new Date(Number(month.slice(0,4)),Number(month.slice(5))-2,1);
      var previousMonth = previousDate.getFullYear() + '-' + String(previousDate.getMonth()+1).padStart(2,'0');
      var carried = (monthRows.get(previousMonth) || []).filter(function (r) { return r.followup === '다음 달 이월' && r.status !== '성공' && r.status !== '제외'; }).map(function (r) {
        return Object.assign({},r,{status:'방문 예정',followup:'미정',visit:'',day:1,carriedFrom:previousMonth,generated:false});
      });
      var generated = fixtureMonths.includes(month) ? createRows(month) : [];
      var plans = names.flatMap(function (owner) {
        var carry = carried.filter(function (r) { return r.owner === owner; });
        var used = new Set(carry.map(function (r) { return r.code; }));
        return carry.concat(generated.filter(function (r) { return r.owner === owner && !used.has(r.code); }).slice(0,Math.max(0,planCount(owner,month)-carry.length)));
      });
      monthRows.set(month,plans); persist();
    }
    var today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
    var statusesChanged=false;
    monthRows.get(month).forEach(function (row) {
      if (row.generated!==true || row.userEdited || row.userAdded || row.carriedFrom) return;
      var visit=row.visit || (row.day ? month+'-'+String(row.day).padStart(2,'0') : '');
      var status=visit && visit<today ? ['상담 중','재방문'][Math.floor(monthRandom(row.owner,visit+'|'+row.code)()*2)] : '방문 예정';
      if (row.status!==status) { row.status=status; statusesChanged=true; }
    });
    if (statusesChanged) persist();
    var alive = new Set();
    var linked = [];
    reports.forEach(function (report) {
      var collectionYear=Number(report.collectionYear || String(report.date).slice(0,4));
      var collectionMonth=Number(report.collectionMonth || String(report.date).slice(5,7));
      var planDate=new Date(collectionYear,collectionMonth-2,1);
      var reportPlanMonth=planDate.getFullYear()+'-'+String(planDate.getMonth()+1).padStart(2,'0');
      if (!report.id || reportPlanMonth !== month || !names.includes(report.owner)) return;
      var id = String(report.id); if (alive.has(id)) return; alive.add(id);
      var source = { owner:report.owner, client:report.client, branch:report.branchName || '지점 미지정', code:String(report.clientCode || ''), type:report.type === '매출증대' || report.type === '증대' ? '증대' : '신규', product:productGroup(report.product), amount:Number(report.amount || 0), visit:String(report.date || '') };
      if (source.type==='증대' && source.product==='3제+클로르') source.product='3제';
      var signature = JSON.stringify(source);
      var cached = reportPlans.get(id);
      if (!cached) { cached = { row:{status:'성공',followup:'미정',note:''}, signature:'' }; reportPlans.set(id,cached); }
      if (cached.signature !== signature) { Object.assign(cached.row,source); cached.signature = signature; }
      cached.row.reportAmount=Number(report.amount || 0);
      cached.row.reportId=id;
      cached.row.visit=source.visit;
      cached.row.status=source.visit && source.visit<=today ? '성공' : '방문 예정';
      linked.push(cached.row);
    });
    monthRows.get(month).forEach(function (row) { if (row.visit) row.visit=planVisit(row.visit,month); });
    return replaceGeneratedPlans(monthRows.get(month),linked);
  }
  function node(tag, text, cls) { var n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
  function money(value) { return value.toLocaleString('ko-KR') + '원'; }
  el('menuSalesPlanBtn').onclick = function () { closeAdminMenu(); setActiveView('salesplan',true); render(); };
  names.forEach(function (name) { var option = node('option', name); option.value = name; el('planOwner').append(option); }); el('planOwner').value = selected;
  function updateSummary() {
    var all = rows().filter(function (r) { return r.owner === selected; });
    var total = all.reduce(function (sum,r) { return sum + (r.status === '제외' ? 0 : r.amount); }, 0);
    var success = all.filter(function (r) { return r.status === '성공'; });
    el('planSummary').replaceChildren();
    [['목표매출', money(2000000)], ['예상매출', money(total)], ['확정매출', money(success.reduce(function (sum,r) { return sum + r.amount; },0))], ['성공률', (all.length ? Math.round(success.length / all.length * 100) : 0) + '%']].forEach(function (metric,i) { var box = node('div',undefined,i === 2 ? 'plan-confirmed' : ''); box.append(node('span',metric[0]),node('strong',metric[1])); el('planSummary').append(box); });
  }
  var columns = [
    {key:'branch',label:'지점'}, {key:'client',label:'거래처명'}, {key:'code',label:'거래처코드'},
    {key:'type',label:'구분',choices:['신규','증대']}, {key:'product',label:'목표 품목',choices:productGroups},
    {key:'amount',label:'예상매출 · 만원',type:'number'}, {key:'visit',label:'방문 예정일',type:'date'},
    {key:'status',label:'진행상태',choices:['방문 예정','상담 중','재방문','성공','제외']},
    {key:'followup',label:'후속 처리',choices:['미정','이번 달 재방문','다음 달 이월','제외']}, {key:'note',label:'비고'}
  ];
  function cell(row,column,index,colIndex) {
    var td = node('td',undefined,'plan-cell plan-cell-' + column.key), input = node(column.choices ? 'select' : 'input');
    var choices = column.key==='product' && row.type==='증대' ? ['3제','클로르'] : column.choices;
    if (choices) choices.forEach(function (choice) { var option = node('option',choice); option.value = choice; input.append(option); }); else input.type = column.type || 'text';
    if (column.type === 'number') { input.min = '0'; input.step = '0.0001'; }
    if (column.type === 'date' && row.reportId) input.readOnly=true;
    if (column.type === 'date' && !row.reportId) {
      var month=el('planMonth').value;
      input.min=month+'-01'; input.max=planVisit(month+'-31',month);
    }
    function value() { return column.key === 'amount' ? row.amount / 10000 : column.key === 'visit' ? row.visit || (row.day ? el('planMonth').value + '-' + String(row.day).padStart(2,'0') : '') : row[column.key]; }
    input.value = value(); input.title = String(input.value); input.setAttribute('aria-label',(index+1) + '행 ' + column.label); input.dataset.key = column.key; input.dataset.column = colIndex;
    if (column.key === 'status') input.dataset.status = row.status;
    input.onfocus = function () { if (input.type === 'text' || input.type === 'number') input.select(); };
    function commit() {
      if (!input.checkValidity() || column.type === 'number' && input.value.trim() === '') { input.value = value(); return; }
      row[column.key] = column.key === 'amount' ? Math.round(Number(input.value)*10000) : input.value.trim(); input.title = String(input.value);
      row.userEdited=true;
      if (row.generated) row.generated=false;
      if (column.key==='type') {
        if (row.type==='증대' && row.product==='3제+클로르') row.product='3제';
        var productInput=td.parentElement.querySelector('[data-key="product"]');
        productInput.replaceChildren();
        (row.type==='증대' ? ['3제','클로르'] : productGroups).forEach(function (choice) { var option=node('option',choice);option.value=choice;productInput.append(option); });
        productInput.value=row.product;productInput.title=row.product;
      }
      if (column.key === 'status') input.dataset.status = row.status; persist(); updateSummary();
    }
    input.onchange = commit;
    input.onkeydown = function (event) {
      if (event.key === 'Escape') { input.value = value(); input.blur(); }
      if (event.key === 'Enter') { event.preventDefault(); commit(); var next = td.parentElement.nextElementSibling; var target = next && next.querySelector('[data-column="'+colIndex+'"]'); if (target) target.focus(); else input.blur(); }
    };
    td.append(input); return td;
  }
  var head = document.querySelector('.plan-table thead tr'); head.replaceChildren(node('th','#')); columns.forEach(function (column) { head.append(node('th',column.label)); });
  function render() {
    var query = el('planSearch').value.trim(); var visible = rows().filter(function (r) { return r.owner === selected && (r.client+r.branch+r.code).includes(query); });
    updateSummary(); el('planCount').textContent = selected + ' · ' + visible.length + '곳'; el('planRows').replaceChildren();
    visible.forEach(function (r,index) { var tr = node('tr'); if (r.reportId) tr.dataset.reportId=r.reportId; tr.append(node('th',index+1,'plan-row-number')); columns.forEach(function (column,colIndex) { tr.append(cell(r,column,index,colIndex)); }); el('planRows').append(tr); });
    el('planEmpty').hidden = visible.length > 0;
    el('planPrevMonth').disabled=el('planMonth').value<='2026-10';
    el('planAddRow').disabled = el('planMonth').value<'2026-10' || el('planMonth').value > new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).slice(0,7);
  }
  el('planAddRow').onclick = function () {
    var month = el('planMonth').value;
    if (month<'2026-10' || month > new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).slice(0,7)) return;
    rows(); el('planSearch').value = '';
    monthRows.get(month).push({owner:selected,client:'',branch:'',code:'',type:'신규',product:'3제',amount:0,day:null,visit:'',status:'방문 예정',followup:'미정',note:'',generated:false,userAdded:true});
    persist(); render();
    var input = el('planRows').lastElementChild.querySelector('[data-key="client"]'); input.focus(); input.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  el('planOwner').onchange = function () { selected = this.value; render(); }; el('planSearch').oninput = render;
  el('planMonth').onchange = function () { if (!this.value) this.value = '2026-10'; render(); };
  function shiftPlanMonth(delta) {
    var month=el('planMonth').value;
    var date=new Date(Number(month.slice(0,4)),Number(month.slice(5))-1+delta,1);
    var next=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');
    if (next<'2026-10') return;
    el('planMonth').value=next; render();
  }
  el('planPrevMonth').onclick=function () { shiftPlanMonth(-1); };
  el('planNextMonth').onclick=function () { shiftPlanMonth(1); };
  var renderReports = window.render;
  window.render = function () { var result = renderReports.apply(this,arguments); render(); return result; };
  if (migrateDrafts) {
    fixtureMonths.forEach(function (month) {
      var previous = monthRows.get(month); if (!previous) return;
      var baseline = previousVersion===2 ? createRows(month,false,true) : createRows(month,true,true);
      if (previous.filter(function (row) { return baseline.some(function (r) { return r.owner===row.owner && r.code===row.code; }); }).length < 10) return;
      var modified = previous.filter(function (row) {
        var original = baseline.find(function (r) { return r.owner===row.owner && r.code===row.code; });
        return !original || Object.keys(original).some(function (key) { return original[key]!==row[key]; });
      });
      var fresh = createRows(month);
      modified.forEach(function (row) {
        var index = fresh.findIndex(function (r) { return r.owner===row.owner && r.code===row.code; });
        if (index>=0) fresh[index]=row; else fresh.push(row);
      });
      monthRows.set(month,fresh);
    });
    monthRows.forEach(function (plans) { plans.forEach(function (row) { if (row.type==='매출증대') row.type='증대'; }); });
    persist();
  }
  monthRows.forEach(function (plans) { plans.forEach(function (row) { if (row.type==='증대' && row.product==='3제+클로르') row.product='3제'; }); });
  monthRows.forEach(function (plans,month) {
    if (!fixtureMonths.includes(month)) return;
    var defaults=createRows(month).concat(createRows(month,false,true),createRows(month,false,false,true));
    plans.forEach(function (row) {
      if (row.generated===true || row.carriedFrom || row.userEdited || row.userAdded) return;
      row.generated=defaults.some(function (original) {
        if (original.owner!==row.owner || original.code!==row.code) return false;
        return Object.keys(original).filter(function (key) { return key!=='generated'; }).every(function (key) {
          var expected=key==='product' && original.type==='증대' && original.product==='3제+클로르' ? '3제' : original[key];
          return expected===row[key];
        });
      });
    });
  });
  try {
    if (!localStorage.getItem('test-sales-plan-triple-first-v2')) {
      monthRows.forEach(function (plans,month) {
        if (!fixtureMonths.includes(month)) return;
        var fresh=createRows(month);
        plans.forEach(function (row) {
          if (row.generated!==true || row.userEdited || row.userAdded || row.carriedFrom) return;
          var replacement=fresh.find(function (r) { return r.owner===row.owner && r.code===row.code; });
          if (replacement) { row.product=replacement.product; row.amount=replacement.amount; }
        });
      });
      localStorage.setItem('test-sales-plan-triple-first-v2','1');
    }
  } catch (_) {}
  monthRows.forEach(function (plans,month) {
    if (!fixtureMonths.includes(month)) return;
    var fresh=createRows(month);
    names.forEach(function (owner) {
      var own=plans.filter(function (r) { return r.owner===owner; });
      if (own.length>=20) return;
      var codes=new Set(own.map(function (r) { return r.code; }));
      fresh.filter(function (r) { return r.owner===owner && !codes.has(r.code); }).slice(0,20-own.length).forEach(function (r) { plans.push(r); });
    });
  });
  monthRows.forEach(function (plans) {
    plans.forEach(function (row) { if (row.generated===true && !row.userEdited && !row.userAdded && row.status==='성공') row.status='방문 예정'; });
  });
  persist();
  render();
  var lastPlanDate=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  function refreshPlanDate() {
    var today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
    if (today!==lastPlanDate) { lastPlanDate=today; render(); }
  }
  setInterval(refreshPlanDate,60000);
  document.addEventListener('visibilitychange',function () { if (!document.hidden) refreshPlanDate(); });
})();
