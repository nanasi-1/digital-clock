//開いた時...
window.addEventListener('load',function(){
    nowLoad();
    colorChange();
    localStorageClear();
})

//デバック用
let debugCount = 1;
let isDebug = false;
//現在時刻取得(通常は空白)
let now = '';
function nowLoad() {
    if (isDebug == false) {
        now = new Date();
    } else {
        now = new Date(now);
        if (debugCount % 4 === 0) {
            now.setSeconds(now.getSeconds() + 1);
        }
    }
    //色変更(15分ごとに)
    if (now.getSeconds() == 0 && now.getMinutes() % 15 == 0 && debugCount % 4 === 0) {
        console.log(now+' change');
        colorChange();
    }
    debugCount++;
}
setInterval("nowLoad()", 250);


//日付と時間表示
function updateDate() {
    const weekDays = ['日','月','火','水','木','金','土'];

    //日付
    document.getElementById('date').innerText =
        now.toLocaleDateString()+'('+weekDays[now.getDay()]+')';

    //時間
    document.getElementById('time').innerText =
        now.toLocaleTimeString();
}

setInterval(updateDate, 250);

function updateSubject() {
/*
0→日誌なし
1→日誌あり
2→日誌なし、次回予告あり(例外扱い。個別で分岐を用意する)
 */
    const timeTable = [
        ['startTime', '9:30', '9:40', 0],
        ['firstPeriod', '9:45', '10:35', 1],
        ['secondPeriod', '10:45', '11:35', 1],
        ['thirdPeriod', '11:45', '12:35', 1],
        ['lunchBreak', '12:35', '13:15', 2],
        ['fourthPeriod', '13:15', '14:05', 1],
        ['fifthPeriod', '14:15', '15:05', 1],
        ['sixthPeriod', '15:15', '16:05', 1],
        ['endTime', '16:05', '16:20', 0],
        ['afterSchool','16:20','17:00',2],
    ];
    const schedule = [
    //0.曜日        1.はじまりの会  2.1コマ目  3.2コマ目　4.3コマ目                   5.4コマ目   6.5コマ目       7.6コマ目   8.おわりの会
     ['Monday',    'はじまりの会', 'PBL',    'PBL',    ['基礎学習','上級英語'],      '基礎学習', 'プログラミング','自由選択', 'おわりの会'],
     ['Tuesday',   'はじまりの会', 'PBL',    'PBL',    '基礎学習', '基礎学習',       '基礎学習', 'プログラミング','自由選択', 'おわりの会'],
     ['Wednesday', 'はじまりの会', 'PBL',    'PBL',    ['基礎学習','初級英語'],      '基礎学習', 'プログラミング','自由選択', 'おわりの会'],
     ['Thursday',  'はじまりの会', 'PBL',    'PBL',    '基礎学習', '基礎学習',       '基礎学習', 'プログラミング','自由選択', 'おわりの会'],
     ['Friday',    'はじまりの会', 'PBL',    'PBL',    ['基礎学習','中級/実践英語'], '基礎学習', 'プログラミング','ミライ',   'おわりの会'],
     ['holiday',   'はじまりの会', '1コマ目', '2コマ目', '3コマ目',                  '4コマ目',  '5コマ目',      '6コマ目',  'おわりの会'],
    ];

    //曜日を取得
    const weekDays = ['holiday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'holiday'];
    let dayOfWeek = weekDays[now.getDay()];
    //現在時間の取得
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let second = now.getSeconds();
    
    //分単位
    const nowTime = hours * 60 + minutes;
    
    //今日の時間割を取得
    let currentSchedule;
    for(let weekdayCount = 0; weekdayCount < 6; weekdayCount++){
        if(dayOfWeek == schedule[weekdayCount][0]){
            currentSchedule = schedule[weekdayCount];
            break;
        }
    }

    //入力欄のplaceholderにデフォルト科目名を表示
    for (let n = 1; n <= 6; n++) {
        if (Array.isArray(currentSchedule[n + 1])) {
            let currentSchedule1=currentSchedule[n + 1][0];
            let currentSchedule2=currentSchedule[n + 1][1];
            document.getElementById('subject-' + n + '-1').placeholder = currentSchedule1;
            document.getElementById('subject-' + n + '-2').placeholder = currentSchedule2;
        }else{
            document.getElementById('subject-' + n + '-1').placeholder = currentSchedule[n + 1];
        }
    }

    //設定されている科目名に変更
    currentSchedule = getSubjectValues(currentSchedule);
    
    if(currentSchedule==''){
        currentSchedule = schedule[5];
    }
    
    
    //現在時刻から今何コマ目か把握
    
    let currentSubject;
    let currentSubjectStart;
    let currentSubjectEnd;

    let start;
    for(let i = timeTable.length-1; i >= 0; i--){
        start = timeTable[i][1].split(':');
        let startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        if(nowTime>=startMinutes){
            currentSubjectStart = timeTable[i][0];
            
            break;
        }
    }

    let end;
    for(let i = 0; i <= timeTable.length; i++){
        end = timeTable[i][2].split(':');
        let endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
        let afterSchool = timeTable[timeTable.length-1][2].split(':');
        let afterSchoolMinutes = parseInt(afterSchool[0])*60 + parseInt(afterSchool[1]);
        
        if(nowTime==endMinutes&&timeTable[i][2]==timeTable[i+1][1]){
            currentSubjectEnd = timeTable[i+1][0];
            end = afterSchool;
            break;
        }else if(nowTime<=endMinutes){
            currentSubjectEnd = timeTable[i][0];
            break;
        }else if(nowTime>=afterSchoolMinutes){
            currentSubjectEnd = timeTable[timeTable.length-1][0];
            break;
        }
    }
    start = start.join(':');
    end = end.join(':');

    //下のバー
    progressBarSet(start, end, timeTable);
    
    //開始時間からの検索結果と終了時間からの検索結果を比較
    //結果が同じ場合、そのコマの真っ最中。結果が違う場合、それぞれの結果の間が現在時刻。
    //違う場合に:beforeをつけて休憩時間と認識させる。
    if(currentSubjectStart==currentSubjectEnd){
        currentSubject=currentSubjectStart+':now';
    }else{
        currentSubject=currentSubjectEnd+':before';
    }
    //出力
    //:beforeで休憩時間の分岐をする準備
    currentSubject = currentSubject.split(':');

    //曜日から科目名を取り出す。
    let periodNo;
    let periodName;
    switch(currentSubject[0]){
        case 'startTime':
            periodNo = 1;
            break;
        case 'firstPeriod':
            periodNo = 2;
            break;
        case 'secondPeriod':
            periodNo = 3;
            break;
        case 'thirdPeriod':
            periodNo = 4;
            break;
        case 'lunchBreak':
            periodNo = 'lunchBreak';
            break;
        case 'fourthPeriod':
            periodNo = 5;
            break;
        case 'fifthPeriod':
            periodNo = 6;
            break;
        case 'sixthPeriod':
            periodNo = 7;
            break;
        case 'endTime':
            periodNo = 8;
            break;
        case 'afterSchool':
            periodNo = 'afterSchool';
            break;
    }
    
    if(periodNo == 'lunchBreak'){
        periodName = '昼休み';
    }else if(periodNo == 'afterSchool'){
        periodName = '放課後';
    }else{
        periodName = currentSchedule[periodNo];
    }
    for(let i=0; i<timeTable.length; i++){
        if(timeTable[i][0]==currentSubject[0]){
            startSecond = timeTable[i][1].split(':');
        }
    }
    
    //nowかbeforeで出力内容が変わるので分岐
    let nowSecond = nowTime * 60 + second;
    if(currentSubject[1]=='now'&&Array.isArray(periodName)){//授業中で科目名複数の場合
        document.getElementById('leftSubject').innerText =
        periodName[0];
        document.getElementById('rightSubject').innerText =
        periodName[1];
        document.getElementById('subject').innerText =
        '';
        
    }else if(currentSubject[1]=='now'){//授業中で科目名単数
        document.getElementById('subject').innerText =
        periodName
        document.getElementById('leftSubject').innerText =
        '';
        document.getElementById('rightSubject').innerText =
        '';
    }else{//休憩時間
        let startSecond;
        let countdownMessage;
        for(let i=0; i<timeTable.length; i++){
            if(timeTable[i][0]==currentSubject[0]){
                startSecond = timeTable[i][1].split(':');
            }
        }
        //分か秒か
        startSecond = startSecond[0]*3600+startSecond[1]*60;
        if((startSecond-nowSecond)/60 > 1){
            countdownMessage = Math.floor((startSecond-nowSecond)/60)+'分';
        }else{
            countdownMessage = (startSecond-nowSecond)+'秒';
        }
        
        //複数ある場合に「〇〇と□□」に
        if(Array.isArray(periodName)){
            periodName=periodName.join('と');
        }
        document.getElementById('subject').innerText =
        periodName+'まで あと'+countdownMessage;
    }
    
    //メッセージを表示
    const diaryText = document.getElementById('diaryMessage');
    //日誌時間が必要か否か
    let needDiary = 0;
    //日誌開始時間を格納
    let diaryStartTime;
    for(let i=0; i<timeTable.length; i++){
        if(currentSubject[0]==timeTable[i][0]){
            needDiary = timeTable[i][3];
            diaryStartTime = timeTable[i][2];
            break;
        }
    }
    
    diaryStartTime = 
    parseInt(diaryStartTime.split(':')[0])*60 + 
    parseInt(diaryStartTime.split(':')[1]);
    //日誌メッセージを表示
    let diaryMessage='残り{n分}になりました。日誌を記入しましょう！';
    //変数にはそのコマの終了時刻を格納。現在時刻との差が5分になるとメッセージを表示
    if(diaryStartTime - nowTime <= 5 && needDiary == 1){//メッセージ表示
        diaryMessage = diaryMessage.replace('{n分}','5分');
        diaryText.innerText = diaryMessage;
    }else{//日誌時間外のメッセージ削除
        diaryText.innerText = '';
    }
    
    //昼休み 次のコマへのカウントダウン表示
    let countdownText = document.getElementById('countdown');
    let countdownEndTime;
    if(currentSubject[0] == 'lunchBreak'){
        for (let i = 0; i <= timeTable.length; i++) {
            if (timeTable[i][0] == currentSubject[0]) {
                countdownEndTime = timeTable[i + 1][1];
                break;
            }
        }

        countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject);
    } else {
        countdownText.innerText = '';
    }
    //放課後のこり10分になったらカウントダウン（忘れてそう）<-忘れてた
    if(currentSubject[0] == 'afterSchool'){
        countdownEndTime = timeTable[timeTable.length-1][2];
        countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject)
    }
}

setInterval(updateSubject, 250);

function countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject){
    let countdownMessage;
    let subjectName = currentSchedule[5];
    
    countdownEndTime = countdownEndTime.split(':');
        countdownEndTime = parseInt(countdownEndTime[0]) * 60 + parseInt(countdownEndTime[1]);
        if(currentSubject[0] == 'afterSchool'&&countdownEndTime - nowTime > 10||countdownEndTime <= nowTime){
            return 0;
        }else if(currentSubject[0] == 'afterSchool'){
            subjectName = '放課後 終了';
        }else if (Array.isArray(currentSchedule[5])) {//複数の場合
            subjectName = currentSchedule[5].join('と');
        }
        if (countdownEndTime - nowTime > 1) {//通常
            //休憩時間のカウントダウンが切り捨てのため、辻褄合わせの-1
            countdownMessage = (countdownEndTime - nowTime - 1) + '分';
        } else {//1分未満
            countdownMessage = (countdownEndTime * 60 - nowSecond) + '秒';
        }
        
        countdownText.innerText = subjectName + 'まで あと' + countdownMessage;
}

//背景パターン
const backgroundColorCode = [
    ['weather','Clear','Cloudy','Rainy'],
    ['morning','#87CEEB','#989898','#b4dbf5'],
    ['afternoon','#00BFFF','#bdbdbd','#c4d8e9'],
    ['evening','#FFA07A','#808080','#e0e0ff'],
    ['night','#0B1364','#404040','#2c3e50'],
];

//文字色パターン
const textColorCode = [
    ['weather','Clear','Cloudy','Rainy'],
    ['morning','#ffffff','#ffffff','#353535'],
    ['afternoon','#ffffff','#4f4f4f','#353535'],
    ['evening','#ffffff','#ffffff','#353535'],
    ['night','#ffffff','#ffffff','#ffffff'],
];

function colorChange() {//背景と文字の色を変える。インターバルはこっち。
    const API_KEY = 'df3ff73321f444bbb1e2f97a6bfaa639';
    const CITY = 'tokyo';

    let weather;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            weather = data["weather"][0]["main"];
            const weatherId = data.weather[0].id;
            console.log(data);
            // 天気情報に応じた背景色を設定する
            
            if(weather == 'Thunderstorm'||weather == 'Drizzle'||weather == 'Rain'||weather == 'Snow'){
                console.log('weather -> Rainy');
                weather = 'Rainy';
            }else if(weatherId == 803||weatherId == 804){
                console.log('weather -> Cloudy');
                weather = 'Cloudy';
            }else{
                console.log('weather -> Clear');
                weather = 'Clear';
            }
            
            crossFadeColors(weather);
        });

}

function crossFadeColors(pattern){//背景と文字の色のクロスフェードを行う。デバックならこちら推奨
    //patter -> Clear-morning
    if(pattern.includes('-') == false){
        pattern[0] = pattern;
        const hour = now.getHours();

        if(hour >= 5 && hour <10){//朝
            pattern = pattern+'-morning';
        }else if(hour >= 10 && hour <16){//昼
            pattern = pattern+'-afternoon';
        }else if(hour >= 16 && hour <20){//夕方
            pattern = pattern+'-evening';
        }else{//夜
            pattern = pattern+'-night';
        }
    console.log(pattern);
    }
    pattern=pattern.split('-');
    const body = document.body;
    const transitionTime = 2000;

    let colorCodeNo=[];
    
    for(let y = 1; y < backgroundColorCode.length; y++){
        for(let x = 1; x < backgroundColorCode[y].length; x++){
            if(pattern[0]==backgroundColorCode[0][x] && pattern[1]==backgroundColorCode[y][0]){
                colorCodeNo[0] = y;
                colorCodeNo[1] = x;
            }
        }
    }
    
    const bgColor = backgroundColorCode[colorCodeNo[0]][colorCodeNo[1]];
    const textColor = textColorCode[colorCodeNo[0]][colorCodeNo[1]];

    body.style.transition = `background-color ${transitionTime}ms ease`;
    body.style.backgroundColor = bgColor;

    const textElement = document.querySelectorAll("h1, h2, span, a");
    textElement.forEach((element) =>{
        element.style.transition = `color ${transitionTime}ms ease`;
        element.style.color = textColor;
    });

    //バーの色設定
    const bgColorRGB = {
    R : parseInt(bgColor.slice(1,3), 16),
    G : parseInt(bgColor.slice(3,5), 16),
    B : parseInt(bgColor.slice(5,7), 16)
    }

    const progressBar = document.querySelector('.progress-bar-inner');

    const max = Math.max(...Object.values(bgColorRGB));
    const min = Math.min(...Object.values(bgColorRGB));

    if((max+min)/2 <= 127.5){//背景が暗い
            progressBar.style.backgroundColor = 'rgba(255, 255, 255, 80%)';
    }else{//背景が明るい
            progressBar.style.backgroundColor = 'rgba(30, 30, 30, 80%)';
    }
}

//ボタンの見た目切り替え
let isOpen = false;
$(".openbtn").click(function() {
    $(this).toggleClass('active');
    //ボタンを押された時の背景を暗く
    $(".overlay").toggleClass('active');

    if(isOpen){
        saveInput();
    }else{
        loadInput();
    }
    isOpen = !isOpen;
});

let isfullScreenOpen = false;
$(".fullScreenbtn").click(function() {
    $(this).toggleClass('active');

    if(isfullScreenOpen){
        document.exitFullscreen();
    }else{
        document.documentElement.requestFullscreen();
    }
    isfullScreenOpen = !isfullScreenOpen;
});

//科目名を入力するフォームを取得

function getSubjectValues(defaultSubject){
    const subject1_1 = $('#subject-1-1').val();
    const subject1_2 = $('#subject-1-2').val();
    const subject2_1 = $('#subject-2-1').val(); 
    const subject2_2 = $('#subject-2-2').val();
    const subject3_1 = $('#subject-3-1').val(); 
    const subject3_2 = $('#subject-3-2').val();
    const subject4_1 = $('#subject-4-1').val(); 
    const subject4_2 = $('#subject-4-2').val();
    const subject5_1 = $('#subject-5-1').val(); 
    const subject5_2 = $('#subject-5-2').val();
    const subject6_1 = $('#subject-6-1').val(); 
    const subject6_2 = $('#subject-6-2').val();

    const subjectValues = [
        [subject1_1,subject1_2],
        [subject2_1,subject2_2],
        [subject3_1,subject3_2],
        [subject4_1,subject4_2],
        [subject5_1,subject5_2],
        [subject6_1,subject6_2],
    ];

    for(let i=0; i<subjectValues.length; i++){//+2してるのはdefaultSubjectのズレに合わせているため
        if(subjectValues[i][0]!=''&&subjectValues[i][1]!=''){//両方空白ではない場合
            defaultSubject[i+2] = subjectValues[i];
        }else if(subjectValues[i][0]!=''&&subjectValues[i][1]==''){//1つ目のみ空白ではない場合
            defaultSubject[i+2] = subjectValues[i][0];
        }else if(subjectValues[i][0]==''&&subjectValues[i][1]!=''){//2つ目のみ空白ではない場合
            defaultSubject[i+2] = subjectValues[i][1];
        }
    }

    return defaultSubject;
}

//入力欄を保存する
const inputs = document.querySelectorAll('input');
const inputsName = Array.from(inputs).map(input => input.id);

function loadInput(){
    for(let i=0; i < inputs.length; i++){
        inputs[i].value = localStorage.getItem(inputsName[i]);
    }
}

function saveInput(){
    for(let i=0; i<inputs.length; i++){
        localStorage.setItem(inputsName[i], inputs[i].value);
    }
}

//リンクから開いた時、ローカルストレージを削除
function localStorageClear(){
    if(performance.navigation.type == 0){
        window.localStorage.clear();
    }
}

//画面下のバー
function progressBarSet(startDate, endDate, timeTable){
    const [startTimeHour, startTimeMinute] = timeTable[0][1].split(':');
    let startTime = new Date();
    const [startHour, startMinute, startSecond] = startDate.split(':');
    let endTime = new Date();
    const [endHour, endMinute, endSecond] = endDate.split(':');

    if(startTimeHour==startHour && startTimeMinute==startMinute){
        startTime.setHours(9);
        startTime.setMinutes(0);
        startTime.setSeconds(0);

        endTime.setHours(startHour);
        endTime.setMinutes(startMinute);
        endTime.setSeconds(0);
    }else{
        startTime.setHours(startHour);
        startTime.setMinutes(startMinute);
        startTime.setSeconds(0);

        endTime.setHours(endHour);
        endTime.setMinutes(endMinute);
        endTime.setSeconds(0);
    }

    const progress = Math.max(0, Math.min(1, (now - startTime) / (endTime - startTime)));
    
    
    const progressBar = document.querySelector('.progress-bar-inner');
    progressBar.style.width = `${progress * 100}%`;
}
