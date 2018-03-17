import pick from 'vanilla.js/lodash/pick';
import parseUri from 'vanilla.js/uri/parseUri';


const FIELDS = ['x', 'y', 'isSelected', 'isDirty', 'name', 'type', 'url'];
const OAUTH_API = 'https://open.weixin.qq.com/connect/oauth2/authorize';

function SmartView() {
}

SmartView.create = function () {
  return new SmartView();
}

SmartView.prototype.fromDumb = function (button, x, y) {
  this.data = {
    x: x,
    y: y,
    name: button.name,
    type: button.type,
    url: button.url,
  };

  return this;
};

SmartView.prototype.toSmart = function () {
  const url = parseUri(this.data.url);

  let api = `${url.protocol}//${url.host}${url.path}`;
  if (api === OAUTH_API) {
    let query = parseQuery(url.search);
    this.data.type += `/${query.scope}`;
    this.data.url = query.redirect_uri;
  }

  return this.data;
};

SmartView.prototype.fromSmart = function (menu) {
  this.data = {
    name: menu.name,
    type: menu.type,
    url: menu.url,
  };

  return this;
};

SmartView.prototype.toDumb = function (appId) {
  if (this.data.type === 'view/snsapi_base') {
    this.data.type = 'view';
    let redirect = encodeURIComponent(this.data.url);
    let state = Math.random().toString(36).substring(2);
    this.data.url = `${OAUTH_API}?appid=${appId}&redirect_uri=${redirect}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;
  }

  if (this.data.type === 'view/snsapi_userinfo') {
    this.data.type = 'view';
    let redirect = encodeURIComponent(this.data.url);
    let state = Math.random().toString(36).substring(2);
    this.data.url = `${OAUTH_API}?appid=${appId}&redirect_uri=${redirect}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  }

  return this.data;
};


function genSchema() {
  return [
    { x: 0, y: 5, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 0, y: 4, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 0, y: 3, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 0, y: 2, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 0, y: 1, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 0, y: 0, isSelected: false, isDirty: false, name: '', type: '', url: '' },

    { x: 1, y: 5, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 1, y: 4, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 1, y: 3, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 1, y: 2, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 1, y: 1, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 1, y: 0, isSelected: false, isDirty: false, name: '', type: '', url: '' },

    { x: 2, y: 5, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 2, y: 4, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 2, y: 3, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 2, y: 2, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 2, y: 1, isSelected: false, isDirty: false, name: '', type: '', url: '' },
    { x: 2, y: 0, isSelected: false, isDirty: false, name: '', type: '', url: '' },
  ];
}


export function getInitialMenus(x) {
  if (x) {
    return genSchema().filter(m => m.x === x);
  } else {
    return genSchema();
  }
}

export function fromWeixin(menu) {
  console.assert(menu.button.length > 0, 'If this is the first time you creating the menu, just work from scratch. You don\'t have to download nothing.');

  let formatted = genSchema();

  menu.button.forEach(function (button, x) {
    let idx = formatted.findIndex(m => m.x === x && m.y === 0);

    if (button.sub_button.length === 0) {
      // ** only level 1 menu
      if (button.type === 'view') {
        formatted.splice(idx, 1, SmartView.create().fromDumb(button, x, 0).toSmart());
      } else {
        throw new Error('[model.menu.fromWeixin - NotImplementedError] button should only be the view type');
      }
    } else {
      formatted[idx].name = button.name;
      formatted[idx].type = 'group';

      button.sub_button.reverse().forEach(function (sub, j) {
        let y = j + 1;

        let index = formatted.findIndex(m => m.x === x && m.y === y);
        if (sub.type === 'view') {
          formatted.splice(index, 1, SmartView.create().fromDumb(sub, x, y).toSmart());
        } else {
          // formatted[index].name = sub.name;
          // formatted[index].type = sub.type;
          // formatted[index].url = sub.url;
          throw new Error('[model.menu.fromWeixin - NotImplementedError] button should only be the view type');
        }
      });
    }
  });
  // debugger;
  return formatted;
}

export function fromScratch() {
  let menu = {
    button: [
      {
        name: '点击然后修改',
        sub_button: [
          { name: '点击然后修改', type: 'view', url: 'http://www.bing.com' },
        ],
      },
      {
        name: '点击然后修改',
        sub_button: [
          { name: '点击然后修改', type: 'view', url: 'http://www.bing.com' },
        ],
      },
      {
        name: '点击然后修改',
        sub_button: [
          { name: '点击然后修改', type: 'view', url: 'http://www.bing.com' },
        ],
      },
    ],
  };
  return fromWeixin(menu);
}

export function changeSelect(prev, next) {
  let formatted = [];
  if (prev) {
    let p = pick(prev, FIELDS);
    p.isSelected = false;
    formatted.push(p);
  }
  if (next) {
    let n = pick(next, FIELDS);
    n.isSelected = true;
    formatted.push(n);
  }
  return formatted;
}

export function updateByXY(updates) {
  let menu = pick(updates, FIELDS);
  menu.isSelected = false;
  menu.isDirty = true;
  return [menu];
}

export function exchange(menu1, menu2) {
  let m1 = pick(menu1, FIELDS);
  m1.x = menu2.x;
  m1.y = menu2.y;
  m1.isSelected = true;
  m1.isDirty = true;
  let m2 = pick(menu2, FIELDS);
  m2.x = menu1.x;
  m2.y = menu1.y;
  m2.isSelected = false;
  m2.isDirty = true;
  return [m2, m1];
}

export function translate(group, toX) {
  let formatted = group.map(m => pick(m, FIELDS));
  formatted.forEach(function (m) {
    m.x = toX;
    m.isSelected = false;
    m.isDirty = !!m.name;
  });
  return formatted;
}

export function moveDown(uppers) {
  let formatted = uppers.map(m => pick(m, FIELDS));
  formatted.forEach(function (m) {
    m.y -= 1;
    if (m.name) {
      m.isDirty = true;
    }
  });
  formatted.push({ x: formatted[0].x, y: 5, isSelected: false, isDirty: false, name: '', type: '', url: '' });
  return formatted;
}

export function cleanup(menus) {
  let formatted = menus.map(m => pick(m, FIELDS));
  formatted.forEach(function (m) {
    m.isSelected = false;
    m.isDirty = false;
  });
  return formatted;
}

export function toWeixin(menus, appId) {
  let button0 = menus.filter(m => m.x === 0 && m.y === 0)[0];
  let group0 = menus.filter(m => m.x === 0 && m.y > 0 && m.name);
  let sub0 = group0.map(function (m) {
    return SmartView.create().fromSmart(m).toDumb(appId);
  });

  let button1 = menus.filter(m => m.x === 1 && m.y === 0)[0];
  let group1 = menus.filter(m => m.x === 1 && m.y > 0 && m.name);
  let sub1 = group1.map(function (m) {
    return SmartView.create().fromSmart(m).toDumb(appId);
  });

  let button2 = menus.filter(m => m.x === 2 && m.y === 0)[0];
  let group2 = menus.filter(m => m.x === 2 && m.y > 0 && m.name);
  let sub2 = group2.map(function (m) {
    return SmartView.create().fromSmart(m).toDumb(appId);
  });
  // debugger;

  let payload = [];

  // FIXME: other types
  if (button0.type === 'view') {
    payload.push({
      name: button0.name,
      type: button0.type,
      url: button0.url,
    });
  } else {
    payload.push({
      name: button0.name,
      sub_button: sub0,
    });
  }

  if (button1.type === 'view') {
    payload.push({
      name: button1.name,
      type: button1.type,
      url: button1.url,
    });
  } else {
    payload.push({
      name: button1.name,
      sub_button: sub1,
    });
  }

  if (button2.type === 'view') {
    payload.push({
      name: button2.name,
      type: button2.type,
      url: button2.url,
    });
  } else {
    payload.push({
      name: button2.name,
      sub_button: sub2,
    });
  }

  return {
    button: payload,
  };
}
