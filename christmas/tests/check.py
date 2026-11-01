"""Run with Python Playwright. No external services or package installation needed."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
import json,re
from collections import deque
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT.parent)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/{ROOT.name}/'
checks=0
def ok(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/pagead2.googlesyndication.com/**',lambda route:route.abort())
  page.goto(base+'christmas/');page.wait_for_selector('.door')
  ok(page.locator('.door').count()==24,'24 doors and repository base routing')
  result=page.evaluate('''async()=>{const m=await import('./core.js');const c=m.validateContent(await(await fetch('content.json')).json());const tests=[!m.unlocked(1,2026,new Date('2026-11-30T23:59:59Z')),m.unlocked(1,2026,new Date('2026-12-01T00:00:00Z')),!m.unlocked(2,2026,new Date('2026-12-01T23:59:59Z')),m.unlocked(2,2026,new Date('2026-12-02T00:00:00Z')),m.unlocked(1,2026,new Date('2026-12-20T00:00:00Z')),!m.unlocked(25,2026,new Date('2026-12-24T23:59:59Z')),m.unlocked(25,2026,new Date('2026-12-25T00:00:00Z')),m.unlocked(24,2026,new Date('2027-01-01T00:00:00Z')),!m.unlocked(1,2027,new Date('2026-12-31T23:59:59Z')),m.londonDate(new Date('2026-07-01T23:30:00Z')).day===2];const p=m.profile('Unit');m.award(p,'game:2',2,3);m.award(p,'game:2',2,5);tests.push(m.total(p)===2&&p.scores['game:2']===5,m.quizStars(5,5)===3,m.quizStars(0,5)===1);const storage={value:null,getItem(){return this.value},setItem(k,v){this.value=v}};m.save(storage,{version:1,active:p.id,profiles:[p]});tests.push(m.load(storage).profiles[0].scores['game:2']===5);try{m.validateContent({...c,days:[]});tests.push(false)}catch{tests.push(true)}return tests}''')
  ok(all(result),'content, London midnight/DST/year boundaries, finale, storage, scoring and validation')
  page.clock.install(time=__import__('datetime').datetime(2026,11,15,tzinfo=__import__('datetime').timezone.utc))
  page.reload();page.wait_for_selector('.door')
  page.locator('.door').first.click();ok('opens on 1 December' in page.locator('#activity').inner_text(),'pre-December locked message');page.locator('#close').click()
  page.goto(base+'christmas/?admin=true&testMode=true&date=2026-12-25');page.wait_for_selector('.door')
  ok(page.locator('.door.available').count()==0,'query parameters do not unlock calendar')
  page.locator('#finale').click();ok('opens on 25 December' in page.locator('#activity').inner_text(),'finale locked before Christmas');page.locator('#close').click()
  def demo(day):
   page.locator('#preview').click();page.locator('#activity').get_by_role('button',name=re.compile(r'^'+str(day)+r' ·')).click()
   page.wait_for_timeout(100)
  for day in range(1,25):
   demo(day);ok(len(page.locator('#activity').inner_text())>20,f'day {day} has usable content');page.locator('#close').click()
  ok('0 / 24' in page.locator('#stats').inner_text(),'demo leaves family door progress untouched')
  # Gameplay rules are pure and shared by the actual arcade implementation.
  rules=page.evaluate("""async()=>{const m=await import('./games/engine.js');let s={score:0,streak:0,best:0,hits:0,shots:0};for(let i=0;i<4;i++)s=m.targetShot(s,'elf');const combo=s.score===50&&s.best===4;const gold=m.targetShot(s,'gold');const safe=m.targetShot(gold,'snowman');const overlap=m.stackOverlap(.3,.5,.4,.4);return [combo,gold.score===90,safe.score===75&&safe.streak===0,m.targetShot(s,'empty').score===50,Math.abs(overlap.width-.4)<.001,m.stackOverlap(0,.1,.8,.1).width===0,m.sortScore(true,3)===16,m.sortScore(false,9)===0]}""")
  ok(all(rules),'combo multipliers, golden elves, penalties, stack collision and factory scoring')
  for day in [1,3,13,19]:
   demo(day);ok(page.locator('input[type=file],video').count()==0,f'day {day} is playable with no media picker');page.locator('#close').click()
  demo(1);page.get_by_role('button',name='Start the adventure',exact=True).click()
  board=page.locator('.quest-board');board.press('ArrowLeft');ok(page.locator('.game-hud strong').nth(1).inner_text()=='0','village hedges block movement')
  def walk_to(target):
   state=page.locator('.quest-cell').evaluate_all("els=>els.map(e=>({r:Number(e.dataset.row),c:Number(e.dataset.col),wall:e.classList.contains('wall'),player:e.classList.contains('player')}))")
   walls={(e['r'],e['c']) for e in state if e['wall']};start=next((e['r'],e['c']) for e in state if e['player'])
   queue=deque([(start,[])]);seen={start}
   while queue:
    (r,c),path=queue.popleft()
    if (r,c)==target:
     for key in path:board.press(key)
     return
    for dr,dc,key in [(-1,0,'ArrowUp'),(1,0,'ArrowDown'),(0,-1,'ArrowLeft'),(0,1,'ArrowRight')]:
     pos=(r+dr,c+dc)
     if 0<=pos[0]<7 and 0<=pos[1]<7 and pos not in walls and pos not in seen:seen.add(pos);queue.append((pos,path+[key]))
   raise AssertionError('unreachable village target')
  while page.locator('.quest-cell.spark').count():
   cell=page.locator('.quest-cell.spark').first;walk_to((int(cell.get_attribute('data-row')),int(cell.get_attribute('data-col'))))
  walk_to((3,3));ok(page.locator('.quest-village .lit').count()==5 and page.locator('.game-result').is_visible(),'day 1 sparks, maze completion and village reveal');ok('You lit up Christmas!' in page.locator('.game-result').inner_text(),'day 1 reward');page.locator('#close').click()
  demo(3);page.get_by_role('button',name='Start stacking',exact=True).click()
  for level in range(10):
   moving=page.locator('.moving-block');base_block=page.locator('.settled-block').last if level else page.locator('.base-block')
   target_x=float(base_block.evaluate('e=>parseFloat(e.style.left)'))/100
   x=float(moving.evaluate('e=>parseFloat(e.style.left)'))/100
   page.clock.run_for(max(0,round(abs(target_x-x)/(.26+level*.025)*1000)))
   page.get_by_role('button',name='Drop present · Space',exact=True).click()
  ok('A towering triumph!' in page.locator('.game-result').inner_text(),'ten actual overlapping gifts complete tower');page.locator('#close').click()
  demo(13);page.get_by_role('button',name='Start the conveyor',exact=True).click()
  for parcel in range(15):
   label=page.locator('.factory-stage h4').inner_text();page.locator('.sorting-bins').get_by_role('button',name=re.compile(re.escape(label))).click();page.clock.run_for(350)
  ok('The sleigh is packed!' in page.locator('.game-result').inner_text(),'factory completes after 15 correct sorts');ok('15 correct' in page.locator('.game-result').inner_text(),'factory reports actual correct answers');page.locator('#close').click()
  demo(19);page.get_by_role('button',name='Follow Frosty',exact=True).click()
  for length in range(1,9):
   sequence=[];page.clock.run_for(650)
   for i in range(length):
    if i:page.clock.run_for(750)
    sequence.append(page.locator('.echo-pad').evaluate_all('els=>els.findIndex(e=>e.classList.contains("glowing"))'))
   page.clock.run_for(750)
   for step in sequence:
    assert step>=0,'visible sequence step';page.locator('.echo-pad').nth(step).click()
   if length<8:page.clock.run_for(800)
  ok('A magical memory!' in page.locator('.game-result').inner_text(),'Frosty sequence can be observed, repeated and completed');page.locator('#close').click()
  demo(12);page.get_by_role('button',name='Start',exact=True).click();page.get_by_role('button',name='Pause',exact=True).click();time_left=page.locator('.game-hud strong').nth(1).inner_text();page.clock.run_for(5000);ok(page.locator('.game-hud strong').nth(1).inner_text()==time_left,'elf pause freezes round');page.get_by_role('button',name='Resume',exact=True).click();page.locator('#close').click()
  demo(20);page.get_by_role('button',name='Start',exact=True).click()
  destination=float(page.locator('.delivery-house.destination').evaluate('e=>parseFloat(e.style.left)'))/100
  sky=page.locator('.sky-stage');bounds=sky.bounding_box();sky.hover(position={'x':bounds['width']*destination,'y':bounds['height']*.75})
  page.get_by_role('button',name='Deliver · Space',exact=True).click();page.get_by_role('button',name='Deliver · Space',exact=True).click()
  ok(page.locator('.parcel').count()==1,'delivery launch cooldown blocks duplicate presents')
  page.clock.run_for(1000);ok(page.locator('.game-hud strong').nth(2).inner_text()=='1','launched present reaches the correct house');ok(int(page.locator('.game-hud strong').first.inner_text())>0,'delivery earns points through actual flight');page.locator('#close').click()
  demo(4);page.get_by_role('button',name='Start',exact=True).click();page.clock.run_for(900)
  flake=page.locator('.sky-object').first;position=float(flake.evaluate('e=>parseFloat(e.style.left)'))/100
  sky=page.locator('.sky-stage');bounds=sky.bounding_box();sky.hover(position={'x':bounds['width']*position,'y':bounds['height']*.8})
  for _ in range(50):
   page.clock.run_for(100)
   if int(page.locator('.game-hud strong').first.inner_text())>0:break
  ok(int(page.locator('.game-hud strong').first.inner_text())>0,'moving basket catches an actual falling snowflake');page.locator('#close').click()
  page.clock.run_for(2000);ok(page.locator('#activity .game-result').count()==0,'closing active games cancels their work')
  demo(2);page.get_by_role('button',name='Start',exact=True).click()
  choices=['Reindeer','Six','Mistletoe','A star or angel','24 December']
  for i,answer in enumerate(choices):
   page.locator('#activity').get_by_role('button',name=answer,exact=True).click()
   ok('Correct!' in page.locator('#feedback').inner_text(),f'quiz answer {i+1} feedback')
   page.get_by_role('button',name='See results' if i==4 else 'Next question',exact=True).click()
  ok('5 / 5' in page.locator('#activity').inner_text(),'quiz scoring');page.get_by_role('button',name='Play again',exact=True).click();ok(page.get_by_role('button',name='Start',exact=True).is_visible(),'quiz restart');page.locator('#close').click()
  demo(10)
  # Solve from revealed faces only. Recompute enabled cards after each pair.
  # This handles any shuffle without clicking a pair already matched earlier.
  known={}
  while page.locator('#activity .grid button:enabled').count():
   cards=page.locator('#activity .grid button')
   enabled=[i for i in range(12) if cards.nth(i).is_enabled()]
   known_pair=next(((i,j) for i in enabled for j in enabled if i<j and i in known and j in known and known[i]==known[j]),None)
   i=known_pair[0] if known_pair else next((i for i in enabled if i not in known),enabled[0])
   cards.nth(i).click();known[i]=cards.nth(i).inner_text()
   j=next((j for j in enabled if j!=i and known.get(j)==known[i]),None)
   if j is None:j=next((j for j in enabled if j!=i and j not in known),next(j for j in enabled if j!=i))
   cards.nth(j).click();known[j]=cards.nth(j).inner_text()
   if known[i]!=known[j]:page.clock.run_for(850)
  ok('Wonderful!' in page.locator('#feedback').inner_text(),'memory completion reflects matching');page.locator('#close').click()
  demo(4);page.get_by_role('button',name='Start',exact=True).click();page.clock.run_for(31000);ok(page.get_by_role('button',name='Play again',exact=True).is_visible(),'snowball timed completion');page.get_by_role('button',name='Play again',exact=True).click();ok(page.get_by_role('button',name='Start',exact=True).is_visible(),'arcade restart');page.locator('#close').click()
  for day in [12,20]:
   demo(day);page.get_by_role('button',name='Start',exact=True).click()
   if day==12:
    page.clock.run_for(800);target=page.get_by_role('button',name=re.compile(r'Window \d+: elf target')).first;slot=int(re.search(r'Window (\d+)',target.get_attribute('aria-label')).group(1))-1;page.locator('.elf-window').nth(slot).click();ok(page.locator('.game-hud strong').first.inner_text()=='10','target hit awards ten points');page.locator('.elf-window').nth(slot).click();ok(page.locator('.game-hud strong').first.inner_text()=='10','same elf cannot score twice')
   page.clock.run_for(31000);ok(page.get_by_role('button',name='Play again',exact=True).is_visible(),f'game {day} completes and offers restart');page.locator('#close').click()
  demo(15);page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Save finished tree',exact=True).click();ok('Wonderful!' in page.locator('#feedback').inner_text(),'keyboard tree decoration');page.locator('#close').click()
  demo(18);page.get_by_role('button',name='Start race',exact=True).click();page.clock.run_for(6500);ok('wins!' in page.locator('#feedback').inner_text(),'race has a finishing result');page.locator('#close').click()
  demo(16);page.get_by_role('button',name='Spin the wheel',exact=True).click();page.clock.run_for(3200);ok(page.get_by_role('button',name='We completed the challenge',exact=True).is_visible(),'wheel reveals a challenge');page.locator('#close').click()
  page.clock.set_system_time(__import__('datetime').datetime(2026,12,25,tzinfo=__import__('datetime').timezone.utc));page.reload();page.wait_for_selector('.door.available')
  page.locator('.door').first.click();page.locator('#close').click();page.reload();page.wait_for_selector('.door.opened');ok('1 / 24' in page.locator('#stats').inner_text(),'opening progress reloads');page.locator('.door').first.click();page.locator('#close').click();ok('1 stars' in page.locator('#stats').inner_text(),'duplicate opening award prevented')
  page.locator('.door').nth(12).click();page.get_by_role('button',name='Start the conveyor',exact=True).click()
  for _ in range(15):
   label=page.locator('.factory-stage h4').inner_text();page.locator('.sorting-bins').get_by_role('button',name=re.compile(re.escape(label))).click();page.clock.run_for(350)
  earned=page.locator('#stats').inner_text();ok('5 stars' in earned,'real game completion earns stars alongside opened doors')
  page.get_by_role('button',name='Play again',exact=True).click();page.get_by_role('button',name='Start the conveyor',exact=True).click()
  for _ in range(15):
   label=page.locator('.factory-stage h4').inner_text();page.locator('.sorting-bins').get_by_role('button',name=re.compile(re.escape(label))).click();page.clock.run_for(350)
  ok(page.locator('#stats').inner_text()==earned,'replaying a completed game cannot farm stars');page.locator('#close').click()
  page.reload();page.wait_for_selector('.door');ok('5 stars' in page.locator('#stats').inner_text(),'new game rewards survive reload')
  page.locator('#finale').click();ok(page.locator('#activity').get_by_text('MERRY CHRISTMAS!',exact=True).is_visible(),'Christmas Day finale');page.get_by_role('button',name='Christmas party game · Toy Factory',exact=True).click();page.get_by_role('button',name='Start the conveyor',exact=True).wait_for();ok(page.get_by_role('button',name='Start the conveyor',exact=True).is_visible(),'finale includes a playable party game');page.locator('#close').click()
  page.locator('#addProfile').click();page.locator('input[name=name]').fill('Elf Tester');page.get_by_role('button',name='Save profile',exact=True).click();ok('0 / 24' in page.locator('#stats').inner_text(),'separate profile progress');page.reload();page.wait_for_selector('.door');ok('Elf Tester' in page.locator('#profiles').inner_text(),'profile reload')
  page.keyboard.press('Tab');ok(page.evaluate('document.activeElement !== document.body'),'keyboard focus');page.locator('.door').first.focus();page.keyboard.press('Enter');ok(page.locator('#surprise').evaluate('(e)=>e.open'),'keyboard opens door');page.keyboard.press('Escape');ok(not page.locator('#surprise').evaluate('(e)=>e.open'),'Escape closes modal')
  for size in [(390,844),(320,700),(768,1024)]:
   page.set_viewport_size({'width':size[0],'height':size[1]});ok(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'no overflow at {size[0]}px')
  ok(page.locator('video,input[type=file]').count()==0,'no visitor media upload or video remains')
  for width in [320,390]:
   page.set_viewport_size({'width':width,'height':844})
   for day,start_name in [(1,'Start the adventure'),(3,'Start stacking'),(12,'Start'),(13,'Start the conveyor'),(19,'Follow Frosty'),(20,'Start')]:
    demo(day);page.get_by_role('button',name=start_name,exact=True).click()
    ok(page.locator('#surprise').evaluate('e=>e.scrollWidth<=e.clientWidth'),f'game {day} fits {width}px dialog');page.locator('#close').click()
  page.goto(base);ok(page.locator('a[href="./christmas/"]').count()==1,'homepage calendar link');ok(page.locator('#secPranks').count()==1 and page.locator('#secGames').count()==1,'existing hub retained')
  # Verify all new relative HTML assets and static publication files.
  for file in (ROOT/'christmas').rglob('*'):
   if file.is_file() and '__pycache__' not in str(file):
    response=page.request.get(base+'christmas/'+str(file.relative_to(ROOT/'christmas')));assert response.status==200,str(file)
  ok(True,'all calendar files served without build')
  ok(not errors,'no browser JavaScript errors: '+str(errors));browser.close()
finally:server.shutdown()
print(f'{checks} checks passed')
