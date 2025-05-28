export default function fillSelect(id, values) {
    const select = document.getElementById(id);
    [...values].sort().forEach(v => {
      if(v === '') return;
      const option = document.createElement('option');
      option.value = v;
      option.textContent = v;
      select.appendChild(option);
    });
  }