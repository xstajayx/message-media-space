"""Run with Python Playwright. No external services or package installation needed."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
import json,re
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
  result=page.evaluate('''async()=>{const m=await import('./core.js');const c=m.validateContent(await(await fetch('content.json')).json());const tests=[!m.unlocked(1,2026,new Date('2026-11-30T23:59:59Z')),m.unlocked(1,2026,new Date('2026-12-01T00:00:00Z')),!m.unlocked(2,2026,new Date('2026-12-01T23:59:59Z')),m.unlocked(2,2026,new Date('2026-12-02T00:00:00Z')),m.unlocked(1,2026,new Date('2026-12-20T00:00:00Z')),!m.unlocked(25,2026,new Date('2026-12-24T23:59:59Z')),m.unlocked(25,2026,new Date('2026-12-25T00:00:00Z')),m.unlocked(24,2026,new Date('2027-01-01T00:00:00Z')),!m.unlocked(1,2027,new Date('2026-12-31T23:59:59Z')),m.londonDate(new Date('2026-07-01T23:30:00Z')).day===2];const p=m.profile('Unit');m.award(p,'game:2',2,3);m.award(p,'game:2',2,5);tests.push(m.total(p)===2&&p.scores['game:2']===5,m.quizStars(5,5)===3,m.quizStars(0,5)===1);const storage={value:null,getItem(){return this.value},setItem(k,v){this.value=v}};m.save(storage,{version:1,active:p.id,profiles:[p]});tests.push(m.load(storage).profiles[0].scores['game:2']===5,!m.safeMedia('https://evil.test/x.jpg'),!m.safeMedia('../x.jpg'));try{m.validateContent({...c,days:[]});tests.push(false)}catch{tests.push(true)}return tests}''')
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
  demo(2);page.get_by_role('button',name='Start',exact=True).click()
  choices=['Reindeer','Six','Mistletoe','A star or angel','24 December']
  for i,answer in enumerate(choices):
   page.locator('#activity').get_by_role('button',name=answer,exact=True).click()
   ok('Correct!' in page.locator('#feedback').inner_text(),f'quiz answer {i+1} feedback')
   page.get_by_role('button',name='See results' if i==4 else 'Next question',exact=True).click()
  ok('5 / 5' in page.locator('#activity').inner_text(),'quiz scoring');page.get_by_role('button',name='Play again',exact=True).click();ok(page.get_by_role('button',name='Start',exact=True).is_visible(),'quiz restart');page.locator('#close').click()
  demo(10)
  # Read card identities through deterministic DOM interaction rather than alter game logic.
  seen={};matched=set()
  for i in range(12):
   if i in matched:continue
   cards=page.locator('#activity .grid button');cards.nth(i).click();symbol=cards.nth(i).inner_text()
   if symbol in seen and seen[symbol] not in matched:
    j=seen[symbol];cards.nth(j).click();matched.update([i,j])
   else:
    seen[symbol]=i
    j=next((k for k in range(12) if k!=i and k not in matched),None)
    if j is not None:
     cards.nth(j).click();s2=cards.nth(j).inner_text()
     if s2==symbol:matched.update([i,j])
     else:seen[s2]=j;page.wait_for_timeout(850)
  # Complete remaining known pairs.
  while page.locator('#activity .grid button:enabled').count():
   cards=page.locator('#activity .grid button');i=next(i for i in range(12) if cards.nth(i).is_enabled());cards.nth(i).click();s=cards.nth(i).inner_text();j=seen.get(s)
   if j is not None and j!=i and cards.nth(j).is_enabled():cards.nth(j).click()
   else:
    for k in range(12):
     if k!=i and cards.nth(k).is_enabled():
      cards.nth(k).click();v=cards.nth(k).inner_text();seen[v]=k
      if v==s:break
      page.wait_for_timeout(850);cards.nth(i).click()
  ok('Wonderful!' in page.locator('#feedback').inner_text(),'memory completion reflects matching');page.locator('#close').click()
  demo(4);page.get_by_role('button',name='Start',exact=True).click();page.clock.run_for(26000);ok(page.get_by_role('button',name='Play again',exact=True).is_visible(),'snowball timed completion');page.get_by_role('button',name='Play again',exact=True).click();ok(page.get_by_role('button',name='Start',exact=True).is_visible(),'arcade restart');page.locator('#close').click()
  for day in [12,20]:
   demo(day);page.get_by_role('button',name='Start',exact=True).click()
   if day==12:
    page.clock.run_for(800);page.get_by_role('button',name='Hit the elf target',exact=True).first.click();ok('Score: 1' in page.locator('.hud').inner_text(),'target hit awards one point')
   page.clock.run_for(26000);ok(page.get_by_role('button',name='Play again',exact=True).is_visible(),f'game {day} completes and restarts');page.locator('#close').click()
  demo(15);page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Add at selected position',exact=True).click();page.get_by_role('button',name='Save finished tree',exact=True).click();ok('Wonderful!' in page.locator('#feedback').inner_text(),'keyboard tree decoration');page.locator('#close').click()
  demo(18);page.get_by_role('button',name='Start race',exact=True).click();page.clock.run_for(6500);ok('wins!' in page.locator('#feedback').inner_text(),'race has a finishing result');page.locator('#close').click()
  demo(16);page.get_by_role('button',name='Spin the wheel',exact=True).click();page.clock.run_for(3200);ok(page.get_by_role('button',name='We completed the challenge',exact=True).is_visible(),'wheel reveals a challenge');page.locator('#close').click()
  page.clock.set_system_time(__import__('datetime').datetime(2026,12,25,tzinfo=__import__('datetime').timezone.utc));page.reload();page.wait_for_selector('.door.available')
  page.locator('.door').first.click();page.locator('#close').click();page.reload();page.wait_for_selector('.door.opened');ok('1 / 24' in page.locator('#stats').inner_text(),'opening progress reloads');page.locator('.door').first.click();page.locator('#close').click();ok('1 stars' in page.locator('#stats').inner_text(),'duplicate opening award prevented')
  page.locator('#finale').click();ok(page.locator('#activity').get_by_text('MERRY CHRISTMAS!',exact=True).is_visible(),'Christmas Day finale');page.locator('#close').click()
  page.locator('#addProfile').click();page.locator('input[name=name]').fill('Elf Tester');page.get_by_role('button',name='Save profile',exact=True).click();ok('0 / 24' in page.locator('#stats').inner_text(),'separate profile progress');page.reload();page.wait_for_selector('.door');ok('Elf Tester' in page.locator('#profiles').inner_text(),'profile reload')
  page.keyboard.press('Tab');ok(page.evaluate('document.activeElement !== document.body'),'keyboard focus');page.locator('.door').first.focus();page.keyboard.press('Enter');ok(page.locator('#surprise').evaluate('(e)=>e.open'),'keyboard opens door');page.keyboard.press('Escape');ok(not page.locator('#surprise').evaluate('(e)=>e.open'),'Escape closes modal')
  for size in [(390,844),(320,700),(768,1024)]:
   page.set_viewport_size({'width':size[0],'height':size[1]});ok(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'no overflow at {size[0]}px')
  page.goto(base);ok(page.locator('a[href="./christmas/"]').count()==1,'homepage calendar link');ok(page.locator('#secPranks').count()==1 and page.locator('#secGames').count()==1,'existing hub retained')
  # Verify all new relative HTML assets and static publication files.
  for file in (ROOT/'christmas').rglob('*'):
   if file.is_file() and '__pycache__' not in str(file):
    response=page.request.get(base+'christmas/'+str(file.relative_to(ROOT/'christmas')));assert response.status==200,str(file)
  ok(True,'all calendar files served without build')
  ok(not errors,'no browser JavaScript errors: '+str(errors));browser.close()
finally:server.shutdown()
print(f'{checks} checks passed')
