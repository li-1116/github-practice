
(() => {
  const pages = {};
  const add = (group, id, title, purpose, entry, controls, view) => {
    pages[id] = { group, id, title, purpose, entry, controls, view };
  };
  const guides = [
    ['个人账号','subscriptions','Subscriptions','查看并管理订阅','通知 → Manage notifications','Unsubscribe|取消订阅所选讨论或仓库','Repository|按仓库筛选订阅'],
    ['个人账号','account-profile','Public profile','管理公开个人资料','头像 → Settings → Public profile','Name|修改公开显示名称','Bio|编辑个人简介','Update profile|保存公开资料'],
    ['个人账号','appearance','Appearance','调整界面主题','头像 → Settings → Appearance','Theme mode|选择跟随系统或固定主题'],
    ['个人账号','emails','Emails','管理账户邮箱','头像 → Settings → Emails','Add email address|添加并验证新邮箱','Keep my email addresses private|隐藏公开邮箱'],
    ['个人账号','notification-settings','Notifications settings','设置通知渠道','头像 → Settings → Notifications','On GitHub|启用站内通知','Email|启用邮件通知'],
    ['个人账号','authentication','Password and authentication','管理密码和双重验证','头像 → Settings → Password and authentication','Change password|验证当前密码后更新登录密码','Enable two-factor authentication|为登录增加第二道验证'],
    ['个人账号','ssh','SSH and GPG keys','管理认证及签名公钥','头像 → Settings → SSH and GPG keys','New SSH key|添加用于认证的公钥','New GPG key|添加用于验证提交签名的公钥'],
    ['个人账号','tokens','Personal access tokens','查看访问令牌的用途','头像 → Settings → Developer settings','Generate new token|按有效期和权限生成访问令牌'],
    ['仓库管理','releases','Releases','查看发布版本和下载附件','仓库 → About → Releases','Draft a new release|从标签创建发布草稿，需要写权限','Assets|查看此版本的下载文件'],
    ['仓库管理','discussions','Discussions','讨论想法和问答','仓库 → Discussions，需启用','New discussion|选择分类并发起讨论','Mark as answer|把合适的回复标为答案'],
    ['仓库管理','wiki','Wiki','浏览项目文档','仓库 → Wiki，需启用','New Page|新增文档页面，需要编辑权限','Edit|编辑当前文档'],
    ['仓库管理','insights','Insights','查看活动与贡献统计','仓库 → Insights','Contributors|查看贡献者统计','Traffic|查看访问与克隆数据，需有相应权限'],
    ['仓库管理','security','Security and quality','查看仓库安全状态','仓库 → Security and quality','Dependabot alerts|查看依赖漏洞提醒，需启用且有权限','Secret scanning|查看泄露凭证的提醒，需启用且有权限'],
    ['仓库管理','collaborators','Collaborators','管理仓库访问权限','仓库 → Settings → Collaborators','Add people|邀请协作者，需要管理员权限','Remove access|撤销对方的访问权限，需要管理员权限'],
    ['仓库管理','rules','Rulesets','限制分支或标签上的操作','仓库 → Settings → Rules → Rulesets','New ruleset|创建规则集，需要管理员权限','Require a pull request before merging|要求通过拉取请求提交修改'],
    ['仓库管理','site-pages','Pages','从仓库部署静态站点','仓库 → Settings → Pages','Source|选择分支发布或自动化发布','Save|保存发布来源，需要仓库管理权限'],
    ['仓库管理','danger','Danger Zone','查看高影响仓库操作','仓库 → Settings → General → Danger Zone','Change visibility|改变公开或私有状态，需要管理员权限','Transfer ownership|将仓库转给另一个所有者','Delete this repository|删除仓库，真实操作需要额外确认'],
    ['组织管理','members','People','查看组织成员及角色','组织 → People','Invite member|邀请成员，需要组织管理权限','Role|查看或调整成员角色'],
    ['组织管理','teams','Teams','查看团队与仓库访问关系','组织 → Teams','New team|创建团队，需要组织允许','Repositories|查看授予团队访问权的仓库'],
    ['组织管理','org-permissions','Member privileges','了解组织成员权限','组织 → Settings → Member privileges','Base permissions|设定组织成员访问仓库的默认权限','Repository creation|控制谁可以在组织内建仓']
  ];
  for (const [group,id,title,purpose,entry,...items] of guides) {
    add(group,id,title,purpose,entry,items.map(x=>x.split('|')));
  }
  const storageKey = 'github-practice:v1';
  const initial = () => ({
    repo:'', branch:'main', branches:{main:{content:'# 欢迎来到练习仓库', commits:['Initial commit']}},
    pr:null, merged:false, issues:[], issue:null, notificationFilter:'All',
    notifications:[{title:'Review requested: Improve README',type:'Pull requests',read:false},
      {title:'New comment: Fix a typo',type:'Issues',read:false}], steps:{}
  });
  let data;
  try { data = JSON.parse(localStorage.getItem(storageKey)) || initial(); } catch { data = initial(); }
  let current = 'practice', query = '', notice = '';
  const labels = new Map();
  function label(id, name, description) { labels.set(id,[name,description]); }
  function button(id, name, description, disabled = false) {
    label(id,name,description);
    return '<span class="practice-control"><button class="button" data-do="'+id+'" '+(disabled?'disabled':'')+'>'+esc(name)+'</button>'+help(id)+'</span>';
  }
  function help(id) {
    const [name, description] = labels.get(id);
    const noteId = 'help-note-' + id;
    return '<button type="button" class="practice-help" data-help="'+id+'" aria-expanded="false" aria-controls="'+noteId+'" aria-label="'+esc('查看 '+name+' 的中文说明')+'">?</button>'+
      '<span class="practice-inline-note" id="'+noteId+'" hidden>'+esc(description)+'</span>';
  }
  function toggleHelp(button) {
    const note = document.getElementById(button.getAttribute('aria-controls'));
    note.hidden = !note.hidden;
    button.setAttribute('aria-expanded', String(!note.hidden));
  }
  function input(id,name,description,value='', multiline=false) {
    label(id,name,description);
    const field = multiline ? '<textarea id="'+id+'">'+esc(value)+'</textarea>' : '<input id="'+id+'" value="'+esc(value)+'">';
    return '<div class="practice-field"><label for="'+id+'">'+name+'</label>'+help(id)+field+'</div>';
  }
  const taskList = [
    ['仓库与合并',[['create','建仓','new-repo'],['branch','创建分支','branches'],['commit','编辑并提交','workspace'],['pr','创建拉取请求','review'],['merge','合并并查看主分支','review']]],
    ['问题与讨论',[['issue','提交问题','issue-lab'],['comment','添加评论','issue-lab'],['close','关闭或重开','issue-lab']]],
    ['通知收件箱',[['inbox','打开收件箱','inbox'],['filter','按类型筛选','inbox'],['read','标记已读','inbox']]]
  ];
  const go = (id,title) => '<a href="#'+id+'">'+esc(title)+'</a>';
  add('开始','practice','练习路线','跟着三条路线练习，或通过目录自由浏览。','学习站首页',[],()=>taskList.map(([title,steps])=>'<article class="practice-card"><h2>'+title+'</h2><ol>'+steps.map(([key,name,id])=>'<li>'+go(id,name)+(data.steps[key]?' <span class="done">✓ 已完成</span>':'')+'</li>').join('')+'</ol></article>').join('')+button('reset','重置练习','恢复虚构仓库、通知和学习进度，需要再次确认'));
  add('实操','new-repo','New repository','创建一个练习仓库','顶部 ＋ → New repository',[],()=>input('repo-name','Repository name','仓库名称，之后会出现在页面路径中',data.repo)+button('create','Create repository','用输入的名字创建演示仓库',!!data.repo));
  add('实操','branches','Branches','创建和切换分支','仓库 → Code → 分支选择器',[],()=>input('branch-name','Find or create a branch','输入尚未存在的分支名称')+button('branch','Create branch','从当前分支复制文件并切换到新分支',!data.repo)+Object.keys(data.branches).map((branch,index)=>button('switch-'+index,branch,'切换到 '+branch+' 并查看对应的文件')).join(''));
  add('实操','workspace','Code · README.md','编辑 README 并查看提交历史','仓库 → Code → README.md',[],()=>'<p>当前分支 <code>'+esc(data.branch)+'</code></p>'+input('file-content','Edit README.md','编辑当前分支的文件内容',data.branches[data.branch].content,true)+input('commit-message','Commit message','填写本次修改的简短摘要')+button('commit','Commit changes','将修改保存为当前分支的新提交',!data.repo)+'<h2>Commits · 提交历史</h2><ol>'+data.branches[data.branch].commits.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>');
  add('实操','review','Pull requests · Compare changes','比较当前分支与主分支，创建并合并拉取请求','仓库 → Pull requests → New pull request',[],()=>{
    const source = data.pr?.source || data.branch;
    const canOpen = source !== 'main' && data.branches[source].content !== data.branches.main.content;
    return '<p>base: <code>main</code> ← compare: <code>'+esc(source)+'</code></p>'+
      (data.pr?'<h2>'+esc(data.pr.title)+'</h2><p>'+(data.merged?'Merged · 已合并':'Open · 等待合并')+'</p><pre>'+esc(data.branches[source].content)+'</pre>'+button('merge','Merge pull request','把当前请求中的文件和提交合并到主分支',data.merged)+go('workspace','查看文件'):
        input('pr-title','Title','说明改动的目的','Improve README')+button('pr','Create pull request','为有改动的分支创建拉取请求',!canOpen)+'<p>需先切到练习分支并提交改动。</p>');
  });
  add('实操','issue-lab','Issues · Practice','提交问题并管理讨论状态','仓库 → Issues → New issue',[],()=>{
    const selected=data.issues.find(x=>x.id===data.issue);
    return input('issue-title','Title','用一句话描述问题')+input('issue-body','Description','记录背景、现象或重现步骤','',true)+button('issue','Submit new issue','创建一条打开状态的问题')+
      ['All','Open','Closed'].map((x,i)=>button('issue-filter-'+i,x,'按问题状态筛选列表')).join('')+
      data.issues.filter(x=>!data.issueFilter||data.issueFilter==='All'||x.status===data.issueFilter).map(x=>'<p>'+button('issue-'+x.id,'#'+x.id+' '+x.title,'打开该问题的讨论详情')+' '+x.status+'</p>').join('')+
      (selected?'<article class="practice-card"><h2>'+esc(selected.title)+'</h2><p>'+esc(selected.body)+'</p>'+selected.comments.map(x=>'<p>'+esc(x)+'</p>').join('')+input('issue-comment','Leave a comment','输入要追加到讨论的留言','',true)+button('comment','Comment','发布留言到当前问题')+button('close',selected.status==='Open'?'Close issue':'Reopen issue','切换问题的打开和关闭状态')+'</article>':'');
  });
  add('个人账号','inbox','Notifications','筛选通知并处理已读状态','顶部导航 → 通知收件箱',[],()=>
    ['All','Issues','Pull requests','Unread'].map((x,i)=>button('filter-'+i,x,'按 '+x+' 筛选收件箱')).join('')+
    '<p>当前筛选 '+esc(data.notificationFilter)+'</p>'+
    (data.notifications.map((x,i)=>({x,i})).filter(({x})=>data.notificationFilter==='All'||data.notificationFilter===x.type||(data.notificationFilter==='Unread'&&!x.read)).map(({x,i})=>'<article class="practice-card"><b>'+x.title+'</b><p>'+ (x.read?'已读':'未读')+'</p>'+button('read-'+i,'Mark as read','把此通知标记为已读',x.read)+'</article>').join('')||'<p>没有符合筛选条件的通知。</p>'));
  const sidebar = document.querySelector('aside');
  const shell = document.createElement('div');
  shell.id='practice-shell';
  main.before(shell);
  const menu = document.createElement('div');
  menu.className='practice-menu';
  menu.innerHTML=go('practice','练习路线')+' · '+go('catalog','页面和按钮目录')+' · '+go('inbox','通知');
  sidebar.prepend(menu);
  const legacy = [...sidebar.querySelectorAll('[data-page]')].map(b=>[b.dataset.page,b.textContent.trim()]);
  function catalog() {
    const needle=query.trim().toLowerCase();
    const matches = (s)=>s.toLowerCase().includes(needle);
    const rendered = Object.values(pages).filter(p=>matches([p.title,p.purpose,p.entry,...p.controls.flat(),p.search].join(' ')));
    return '<h1>页面和按钮目录</h1><label for="practice-search">搜索中英文页面或按钮</label><input id="practice-search" value="'+esc(query)+'"><div id="catalog-results">'+rendered.map(p=>'<article class="practice-card"><small>'+p.group+'</small><h2>'+go(p.id,p.title)+'</h2><p>'+p.purpose+'</p>'+ (needle?p.controls.filter(x=>matches(x.join(' '))).map(x=>'<p>'+esc(x.join(' · '))+'</p>').join(''):'')+'</article>').join('')+legacy.filter(([,title])=>matches(title)).map(([id,title])=>'<article class="practice-card"><a href="#old-'+id+'">'+esc(title)+'</a><p>旧版交互导览</p></article>').join('')+'</div>';
  }
  function renderPractice() {
    if(current.startsWith('old-')) {
      shell.hidden=true; main.hidden=false; nav(current.slice(4)); return;
    }
    main.hidden=true; shell.hidden=false;
    const p=pages[current];
    shell.innerHTML='<nav class="practice-crumb">'+go('practice','练习路线')+' / '+go('catalog','页面目录')+(data.repo?' / <span>learner / '+esc(data.repo)+'</span>':'')+'</nav>'+
      (p?'<h1>'+p.title+'</h1><p>'+p.purpose+'</p><p class="practice-entry">'+p.entry+'</p><p class="practice-notice" role="status" tabindex="-1">'+esc(notice)+'</p>'+
        (p.view?p.view():'<p>按钮导览 · 点问号查看说明</p>'+p.controls.map(([name,desc],i)=>{const id='guide-'+p.id+'-'+i;label(id,name,desc);return '<p class="practice-guide"><strong>'+esc(name)+'</strong>'+help(id)+'</p>';}).join('')):catalog());
  }
  function route() {
    const hash=location.hash.slice(1);
    current=pages[hash]||hash==='catalog'||legacy.some(([id])=>'old-'+id===hash)?hash:'practice';
    if(current==='inbox'){data.steps.inbox=true;save();}
    notice=''; renderPractice(); window.scrollTo(0,0);
  }
  const save=()=>localStorage.setItem(storageKey,JSON.stringify(data));
  const val=id=>document.getElementById(id)?.value.trim()||'';
  function actPractice(action) {
    const branch=data.branches[data.branch];
    const issue=data.issues.find(x=>x.id===data.issue);
    const [kind,index]=action.split('-');
    if (kind==='switch') { data.branch=Object.keys(data.branches)[Number(index)]; return '已切换分支'; }
    if (kind==='filter') { data.notificationFilter=['All','Issues','Pull requests','Unread'][index]; data.steps.filter=true; return '已应用筛选'; }
    if (kind==='read') { data.notifications[index].read=true; data.steps.read=true; return '通知已标记为已读'; }
    if(action.startsWith('issue-filter-')) { data.issueFilter=['All','Open','Closed'][action.at(-1)]; return '已筛选问题'; }
    if(kind==='issue'&&index) { data.issue=Number(index); return '已打开问题详情'; }
    switch(action) {
      case 'reset':
        if(!confirm('重置此浏览器中的练习数据和进度？')) return null;
        data=initial(); localStorage.removeItem('ghg-completed'); state.completed.clear(); updateProgress(); return '练习已重置';
      case 'create':
        if(!/^[\w.-]{1,100}$/.test(val('repo-name'))) return '请输入仓库名，可使用英文字母、数字、点、短横线和下划线。';
        data.repo=val('repo-name'); break;
      case 'branch': {
        const name=val('branch-name');
        if(!/^[\w/-]+$/.test(name)||name in data.branches) return '请输入一个尚未使用的分支名。';
        data.branches[name]=structuredClone(branch); data.branch=name; break;
      }
      case 'commit': {
        const content=document.getElementById('file-content').value;
        if(content===branch.content||!val('commit-message')) return '请修改文件并填写提交摘要。';
        branch.content=content; branch.commits.unshift(val('commit-message')); break;
      }
      case 'pr':
        if(!val('pr-title')) return '请填写拉取请求标题。';
        data.pr={title:val('pr-title'),source:data.branch}; break;
      case 'merge':
        data.branches.main=structuredClone(data.branches[data.pr.source]); data.branch='main'; data.merged=true; break;
      case 'issue':
        if(!val('issue-title')) return '请填写问题标题。';
        data.issue=data.issues.length+1;
        data.issues.unshift({id:data.issue,title:val('issue-title'),body:val('issue-body'),status:'Open',comments:[]}); break;
      case 'comment':
        if(!val('issue-comment')) return '请输入评论。';
        issue.comments.push(val('issue-comment')); break;
      case 'close': issue.status=issue.status==='Open'?'Closed':'Open'; break;
      default: return null;
    }
    data.steps[action]=true; return '操作成功，练习进度已更新。';
  }
  shell.addEventListener('click',e=>{
    const target=e.target.closest('button');
    if(!target)return;
    if(target.dataset.help){ toggleHelp(target); return; }
    if(target.dataset.do){
      notice=actPractice(target.dataset.do);
      if(notice===null)return;
      save();
      if(notice.startsWith('请')){shell.querySelector('.practice-notice').textContent=notice;return;}
      renderPractice(); shell.querySelector('.practice-notice')?.focus();
    }
  });
  shell.addEventListener('input',e=>{
    if(e.target.id!=='practice-search')return;
    query=e.target.value;
    const fragment=document.createElement('div');
    fragment.innerHTML=catalog();
    shell.querySelector('#catalog-results').replaceWith(fragment.querySelector('#catalog-results'));
  });
  sidebar.addEventListener('click',e=>{
    const item=e.target.closest('[data-page]');
    if(item) location.hash='old-'+item.dataset.page;
  });
  window.addEventListener('hashchange',route);
  window.addEventListener('legacy-page',event=>{if(location.hash!=='#old-'+event.detail) location.hash='old-'+event.detail;});
  for(const p of Object.values(pages)) if(p.view){
    labels.clear(); p.view();
    for(const [id,value] of labels) value.push(p.id);
    p.search=[...labels.values()].flat().join(' ');
  }

  const annotated = new WeakSet();
  let count = 0;
  function annotate() {
    for(const el of document.querySelectorAll('#main button,#main input,#main select,#main textarea,.topbar button,.sidebar button,#profile-menu button,#create-menu button,#search-overlay button')) {
      if(annotated.has(el)||el.matches('.practice-help,[hidden]'))continue;
      annotated.add(el);
      const name=el.dataset.explain||el.getAttribute('aria-label')||el.title||el.textContent.trim()||el.placeholder||el.labels?.[0]?.textContent.trim()||'表单输入';
      const term=vocab.find(x=>x[0].toLowerCase()===name.toLowerCase());
      const extra=el.nextElementSibling;
      const meaning=(el.dataset.page==="feed" && "查看你关注的项目和用户近期的动态。")||el.dataset.meaning||el.dataset.note||el.parentElement.querySelector('.button-annotation')?.textContent||term?.[2]||(extra?.matches('small')&&extra.textContent)||
        (el.matches('input,textarea,select')?'填写或选择此项，用于当前页面的表单或筛选。':el.dataset.page?'打开 '+name+' 页面。':el.classList.contains('quiz-option')?'选择此答案并查看反馈。':'查看 '+name+' 的示例或切换对应状态。');
      const key='legacy-'+ ++count;
      label(key,name,meaning);
      el.insertAdjacentHTML('afterend',help(key));
    }
  }
  document.addEventListener('click',e=>{
    const helpTarget=e.target.closest('[data-help^="legacy-"]');
    if(helpTarget){
      e.stopPropagation();
      toggleHelp(helpTarget);
      return;
    }
    const target=e.target.closest('.topbar [data-page],.sidebar [data-action="open-repo"]');
    if(target) location.hash='old-'+(target.dataset.page||'repo');
  },true);
  new MutationObserver(annotate).observe(document.body,{childList:true,subtree:true});
  annotate();

  route();
})();





