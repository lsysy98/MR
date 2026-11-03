(function () {
  var dialog = document.getElementById('usageGuide');
  var image = document.getElementById('usageGuideImage');
  var caption = document.getElementById('usageGuideCaption');
  var assetBase = new URL('assets/usage-guide/', document.currentScript.src);
  var buttons = dialog.querySelectorAll('[data-guide]');
  var topics = [
    ['share', '캡처 안내에서 이미지 열기 → 공유', '보고 이미지 미리보기와 공유 버튼'],
    ['week', '금요일 또는 이번 주 마지막 평일 → 주간 보고 이미지', '주간현황 캡처 예시'],
    ['leave', '시작일·종료일 선택 → 연차 저장', '연차 시작일, 종료일과 저장 버튼'],
    ['notifications', '담당자·시간 선택 → 알림 받기', '보고 알림 담당자와 시간 설정 예시']
  ];
  function select(index) {
    var topic = topics[index];
    buttons.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === index)); });
    caption.textContent = topic[1];
    image.alt = topic[2];
    image.src = new URL(topic[0] + '.png', assetBase).href;
    dialog.querySelectorAll('.guide-extra').forEach(function (figure) { figure.remove(); });
    if (index === 0) {
      appendStep('연차자를 제외한 전원이 ‘내 보고 완료’ 누르기', 'share-location', true);
    }
    if (index === 1) {
      appendStep('카톡 문구 복사', 'weekly-button');
      appendStep('문구 복사하기 → 카톡에 붙여넣기', 'weekly-copy');
    }
    if (index === 2) {
      appendStep('일일현황에서 ‘연차 설정’ 누르기', 'leave-location', true);
    }
    if (index === 3) {
      appendStep('오른쪽 위 메뉴(☰) → 알림 설정', 'notification-menu', true);
    }
    dialog.scrollTop = 0;
  }
  function appendStep(label, file, before) {
    var figure = document.createElement('figure');
    figure.className = 'guide-figure guide-extra';
    var title = document.createElement('figcaption');
    title.textContent = label;
    var picture = document.createElement('img');
    picture.alt = label;
    picture.src = new URL(file + '.png', assetBase).href;
    picture.className = 'guide-step-image';
    figure.append(title, picture);
    if (before) caption.closest('figure').before(figure);
    else dialog.append(figure);
  }
  buttons.forEach(function (button, index) { button.addEventListener('click', function () { select(index); }); });
  document.getElementById('openUsageGuide').addEventListener('click', function () { select(0); dialog.showModal(); });
})();
