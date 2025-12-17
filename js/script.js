
// 진행도: 선택된 직업군(페르소나) 경로만 보이도록 필터링 및 진행률 계산
(function(){
    const personaMapBySectionId = {
        // 스토리 섹션
        6: 'performer',
        7: 'artist',
        8: 'healer',
        9: 'leader',
        10: 'connector',
        11: 'creator',
        12: 'free',
        32: 'explorer',
        // 퀘스트3 섹션
        13: 'performer',
        26: 'artist',
        27: 'healer',
        28: 'leader',
        29: 'connector',
        30: 'creator',
        31: 'free',
        33: 'explorer'
    };

    const personaNameToIds = {
        performer: [6,13],
        artist: [7,26],
        healer: [8,27],
        leader: [9,28],
        connector: [10,29],
        creator: [11,30],
        free: [12,31],
        explorer: [32,33]
    };
    let selectedPersona = null;

    function hideUnrelatedPersonaSections(){
        // 스토리 섹션(6~12,32) + 퀘스트3(13,26~31,33) 중 선택된 페르소나만 보이도록
        const storyQuestIds = new Set([6,7,8,9,10,11,12,13,26,27,28,29,30,31,32,33]);
        const commonIds = new Set([14, 15, 16, 17, 18, 19, 20]);
        const keepIds = new Set([ ...(selectedPersona ? (personaNameToIds[selectedPersona]||[]) : []), ...commonIds ]);
        document.querySelectorAll('.section').forEach(sec=>{
            const id = Number(sec.getAttribute('data-id'));
            if(storyQuestIds.has(id)){
                if(keepIds.has(id)){
                    sec.classList.remove('hidden');
                    sec.style.display = '';
                } else {
                    sec.classList.add('hidden');
                    sec.style.display = 'none';
                }
            }
        });
        updateProgressVisibleOnly();
    }

    function getVisibleSections(){
        return Array.from(document.querySelectorAll('.section')).filter(s=>!s.classList.contains('hidden'));
    }

    function getActiveSection(){
        return document.querySelector('.section.active');
    }

    function indexInVisible(sec){
        const list = getVisibleSections();
        const idx = list.indexOf(sec);
        return { idx, total: list.length };
    }

    function updateProgressVisibleOnly(){
        const active = getActiveSection();
        const pf = document.getElementById('progressFill');
        const pt = document.getElementById('progressText');
        if(!active || !pf || !pt) return;
        const { idx, total } = indexInVisible(active);
        if(total<=1){
            pf.style.width = '0%';
            pt.textContent = '0%';
            return;
        }
        const percent = Math.round((idx)/(total-1)*100);
        pf.style.width = percent+'%';
        pt.textContent = percent+'%';
    }

    // Observe section activation changes to detect persona and update progress
    const observer = new MutationObserver((mutations)=>{
        mutations.forEach(m=>{
            if(m.type==='attributes' && m.attributeName==='class' && m.target.classList.contains('section')){
                const sec = m.target;
                if(sec.classList.contains('active')){
                    const id = Number(sec.getAttribute('data-id'));
                    if(personaMapBySectionId[id] && !selectedPersona){
                        selectedPersona = personaMapBySectionId[id];
                        hideUnrelatedPersonaSections();
                    }
                    updateProgressVisibleOnly();
                }
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function(){
                // Quest 0-2 상태 카드형 선택지: 카드 전체 클릭 시 선택, 기타 입력란 클릭 시 해당 카드 선택
                document.querySelectorAll('.state-card-choices').forEach(function(group){
                    group.addEventListener('click', function(e){
                        const label = e.target.closest('.state-card');
                        if(label && group.contains(label)) {
                            const radio = label.querySelector('input[type="radio"]');
                            if(radio) {
                                radio.checked = true;
                                // 기타 입력란이 있으면 포커스
                                const etcInput = label.querySelector('input[type="text"]');
                                if(e.target === etcInput) {
                                    radio.checked = true;
                                    etcInput.focus();
                                }
                                // 선택 효과를 위해 강제 change 이벤트 발생
                                radio.dispatchEvent(new Event('change', {bubbles:true}));
                            }
                        }
                    });
                });
        // 네비게이션(섹션 이동 버튼) 제거: 게이지만 보이게 하기
        try {
            const nav = document.getElementById('sectionNav');
            if(nav){
                // progress-wrap 외의 자식 노드 제거
                Array.from(nav.children).forEach(child=>{
                    if(!child.classList || !child.classList.contains('progress-wrap')){
                        child.remove();
                    }
                });
            }
        } catch(e){}

        // 초기: 페르소나 섹션 숨김, 공통만 보이도록
        hideUnrelatedPersonaSections();

        // next/prev 클릭 가로채기: 숨긴 섹션을 건너뛰고 보이는 섹션만 이동
        function getVisibleIds(){
            // DOM 순서 그대로 가시 섹션 ID 배열 반환
            return Array.from(document.querySelectorAll('.section'))
                .filter(s=>!s.classList.contains('hidden'))
                .map(s=>Number(s.getAttribute('data-id')));
        }
        function goToNextPrevVisible(direction){
            const ids = getVisibleIds();
            const active = document.querySelector('.section.active');
            const curId = active ? Number(active.getAttribute('data-id')) : ids[0];
            const idx = ids.indexOf(curId);
            let nextIdx = idx;
            if(direction==='next') nextIdx = Math.min(idx+1, ids.length-1);
            else nextIdx = Math.max(idx-1, 0);
            const nextId = ids[nextIdx];
            if(typeof showSection === 'function') showSection(nextId);
            else {
                document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
                const sec = document.querySelector('.section[data-id="'+nextId+'"]');
                if(sec) sec.classList.add('active');
            }
            updateProgressVisibleOnly();
        }
        document.body.addEventListener('click', function(ev){
            const t = ev.target;
            if(t && t.matches('[data-next]')){
                ev.preventDefault();
                const currentSec = t.closest('.section');
                const currentId = currentSec ? Number(currentSec.getAttribute('data-id')) : null;
                // 현재 섹션에서 퍼스로나 선택값 우선 반영
                let nextId = t.getAttribute('data-next');
                if(currentSec){
                    const chosenPersona = currentSec.querySelector('input[name="persona"]:checked');
                    if(chosenPersona){
                        selectedPersona = chosenPersona.value;
                        const gotoFromChoice = chosenPersona.getAttribute('data-goto');
                        if(gotoFromChoice) nextId = gotoFromChoice;
                        hideUnrelatedPersonaSections();
                    }
                }
                // data-goto 우선 적용 (다른 입력의 분기 처리)
                if(currentSec){
                    const goto = Array.from(currentSec.querySelectorAll('input:checked[data-goto]')).map(el=>el.getAttribute('data-goto')).find(Boolean);
                    if(goto) nextId = goto;
                }
                // 퍼스로나 섹션 도착 시에도 선택 반영
                const personaId = Number(nextId);
                if(personaMapBySectionId[personaId]){
                    selectedPersona = personaMapBySectionId[personaId];
                    hideUnrelatedPersonaSections();
                }
                // 이동
                if(typeof showSection === 'function') showSection(nextId);
                else {
                    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
                    const sec = document.querySelector('.section[data-id="'+nextId+'"]');
                    if(sec) sec.classList.add('active');
                }
                updateProgressVisibleOnly();
            } else if(t && t.matches('[data-prev]')){
                ev.preventDefault();
                const prevId = t.getAttribute('data-prev');
                // 숨김 상태라면 가시 섹션 기준 이전 섹션으로 이동
                const ids = getVisibleIds();
                const active = document.querySelector('.section.active');
                const curId = active ? Number(active.getAttribute('data-id')) : ids[0];
                const idx = ids.indexOf(curId);
                let targetId = prevId;
                if(prevId && !ids.includes(Number(prevId))){
                    const nextIdx = Math.max(idx-1, 0);
                    targetId = ids[nextIdx];
                }
                if(typeof showSection === 'function') showSection(targetId);
                else {
                    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
                    const sec = document.querySelector('.section[data-id="'+targetId+'"]');
                    if(sec) sec.classList.add('active');
                }
                updateProgressVisibleOnly();
            }
        });
        document.querySelectorAll('.section').forEach(sec=>{
            observer.observe(sec, { attributes:true });
        });
        // 초기 한 번 계산
        updateProgressVisibleOnly();
    });
})();

