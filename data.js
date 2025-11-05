/* ======================== Валідація (окремий файл) ======================== */
function FormDataCheck(form) {
  // ПІБ: "Прізвище І.І."
  const fio = form.fio.value.trim();
  if (!/^[А-ЯІЇЄҐ][а-яіїєґ']+\s[А-Я]\.[А-Я]\.$/.test(fio)) {
    alert('Поле "ПІБ" заповнено неправильно. Формат: Прізвище І.І.');
    form.fio.focus(); return false;
  }

  // Варіант 1..36
  const variant = form.variant.value.trim();
  if (!/^(?:[1-9]|[12]\d|3[0-6])$/.test(variant)) {
    alert('Поле "Варіант" має бути числом від 1 до 36');
    form.variant.focus(); return false;
  }

  // Факультет TT-ЧЧ
  const faculty = form.faculty.value.trim();
  if (!/^[A-ZА-ЯІЇЄҐ]{2}-\d{2}$/.test(faculty)) {
    alert('Поле "Факультет" має бути у форматі ТТ-ЧЧ (наприклад, КН-22)');
    form.faculty.focus(); return false;
  }

  // Телефон (XXX)-XXX-XX-XX
  const phone = form.phone.value.trim();
  if (!/^\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(phone)) {
    alert('Введіть телефон у форматі (XXX)-XXX-XX-XX');
    form.phone.focus(); return false;
  }

  // Місто: лише назва
  const city = form.city.value.trim();
  if (!/^[A-ZА-ЯІЇЄҐ][A-Za-zА-Яа-яІіЇїЄєҐґ' -]{1,}$/.test(city)) {
    alert('Поле "Місто" має містити тільки назву міста. Наприклад: Київ');
    form.city.focus(); return false;
  }

  return true; // OK
}

/* ======================== Логіка сторінки ======================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('infoForm');
  const msg  = document.getElementById('formMsg');
  const preview = document.getElementById('previewBox');
  const clearBtn = document.getElementById('clearBtn');
  const variantInput = document.getElementById('variant');
  const phoneInput = document.getElementById('phone');
  const grid = document.getElementById('grid');
  const picker = document.getElementById('pick');
  const variantHint = document.getElementById('variantHint');

  // ===== Маска телефону =====
  function formatPhoneDigits(d){
    const digits = d.replace(/\D/g,'').slice(0,10);
    const parts = [];
    if(digits.length>0){ parts.push('(' + digits.slice(0,3).padEnd(3,'_') + ')'); }
    if(digits.length>=3){ parts.push('-' + digits.slice(3,6).padEnd(3,'_')); }
    if(digits.length>=6){ parts.push('-' + digits.slice(6,8).padEnd(2,'_')); }
    if(digits.length>=8){ parts.push('-' + digits.slice(8,10).padEnd(2,'_')); }
    return parts.join('');
  }
  phoneInput.addEventListener('input', ()=>{
    phoneInput.value = formatPhoneDigits(phoneInput.value);
    phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
  });
  phoneInput.addEventListener('focus', ()=>{
    if(!phoneInput.value) phoneInput.value = formatPhoneDigits('');
  });

  // ===== Будуємо таблицю 6×6 (1..36) =====
  const N = 6;
  let cells = [];
  let activeIndex = null;

  (function createGrid(){
    let n=1;
    for(let r=0;r<N;r++){
      const tr=document.createElement('tr');
      cells[r]=[];
      for(let c=0;c<N;c++){
        const td=document.createElement('td');
        td.textContent=n;
        td.dataset.num=n;
        tr.appendChild(td);
        cells[r][c]=td;
        n++;
      }
      grid.appendChild(tr);
    }
  })();

  function coordByNumber(num){ const k=num-1; return {r:Math.floor(k/N), c:k%N}; }
  function setColor(el,col){ el.style.backgroundColor=col; }
  function randColor(){ return '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'); }

  function clearListeners(){
    grid.querySelectorAll('td').forEach(td=>{ td.replaceWith(td.cloneNode(true)); });
    // відновити посилання
    cells = [];
    const tds = grid.querySelectorAll('td');
    for(let r=0,i=0;r<N;r++){ cells[r]=[]; for(let c=0;c<N;c++,i++){ cells[r][c]=tds[i]; } }
  }

  function highlightVariantCell(num){
    activeIndex = (typeof num==='number' && num>=1 && num<=36) ? num : null;
    grid.querySelectorAll('td').forEach(td=>td.removeAttribute('data-target'));
    clearListeners();

    if(!activeIndex){ variantHint.textContent='Уведіть «Варіант» (1–36) — це номер клітинки.'; return; }

    const {r,c} = coordByNumber(activeIndex);
    const cell = cells[r][c];
    cell.dataset.target='true';

    let prevColor = null;
    cell.addEventListener('mouseenter',()=>{ prevColor = cell.style.backgroundColor; setColor(cell, randColor()); });
    cell.addEventListener('mouseleave',()=>{ setColor(cell, prevColor || ''); });

    cell.addEventListener('click',()=> setColor(cell, picker.value));

    cell.addEventListener('dblclick',()=>{
      const action = ((activeIndex-1)%10)+1; // 1..10
      runAction(action,r,c,cell);
    });

    variantHint.textContent = `Активна клітинка №${activeIndex}. Подвійний клік виконає дію №${((activeIndex-1)%10)+1}.`;
  }

  // Публічне для форми:
  window.highlightVariantCell = highlightVariantCell;

  function runAction(type,r,c,origin){
    const col = picker.value;
    switch(type){
      case 1: for(let j=0;j<N;j++) setColor(cells[r][j], col); break;
      case 2: for(let i=0;i<N;i++) setColor(cells[i][c], col); break;
      case 3: for(let i=0;i<N;i++) setColor(cells[i][i], col); break;
      case 4: for(let i=0;i<N;i++) setColor(cells[i][N-1-i], col); break;
      case 5: grid.querySelectorAll('td').forEach(td=>{ if(td!==origin) setColor(td,col); }); break;
      case 6: for(let i=r;i<N;i++) for(let j=c;j<N;j++) setColor(cells[i][j], col); break;
      case 7: for(let i=r;i<N;i+=2) for(let j=0;j<N;j++) setColor(cells[i][j], col); break;
      case 8: for(let j=c;j<N;j+=2) for(let i=0;i<N;i++) setColor(cells[i][j], col); break;
      case 9: for(let i=r;i<N;i+=2) setColor(cells[i][c], col); break;
      case 10: for(let j=c;j<N;j+=2) setColor(cells[r][j], col); break;
    }
  }

  // ===== Допоміжні =====
  function updatePreview(data){
    const previewBox = document.getElementById('previewBox');
    previewBox.innerHTML = `
      <p><b>ПІБ:</b> ${data.fio}</p>
      <p><b>Варіант:</b> ${data.variant}</p>
      <p><b>Факультет:</b> ${data.faculty}</p>
      <p><b>Телефон:</b> ${data.phone}</p>
      <p><b>Місто:</b> ${data.city}</p>`;
  }

  // Активна клітинка під час введення варіанта
  variantInput.addEventListener('input', ()=>{
    const n = +variantInput.value;
    highlightVariantCell(Number.isInteger(n) && n>=1 && n<=36 ? n : null);
  });

  // Кнопка очистити
  clearBtn.addEventListener('click', ()=>{
    form.reset(); msg.textContent=''; msg.className='msg';
    document.querySelectorAll('#infoForm .error').forEach(el=>el.classList.remove('error'));
    updatePreview({fio:'—', variant:'—', faculty:'—', phone:'—', city:'—'});
    highlightVariantCell(null);
  });

  // Сабміт форми
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!FormDataCheck(form)) return;

    const data = {
      fio: form.fio.value.trim(),
      variant: form.variant.value.trim(),
      faculty: form.faculty.value.trim(),
      phone: form.phone.value.replace(/_/g,'').trim(),
      city: form.city.value.trim()
    };
    updatePreview(data);
    msg.textContent = 'Дані коректні ✔';
    msg.className = 'msg ok';
    highlightVariantCell(+data.variant);
  });
});
