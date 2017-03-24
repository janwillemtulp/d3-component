import { select } from 'd3-selection';

const instanceProperty = '__instance__';

function setInstance(node, value) {
  node[instanceProperty] = value;
}

function getInstance(node) {
  return node[instanceProperty];
}

function dataArray(data, context) {
  data = Array.isArray(data) ? data : [data];
  return context ? data.map(d => Object.assign(Object.create(context), d)) : data;
}

function destroyInstance() {
  select(this).selectAll('*').each(destroyDescendant);
  (getInstance(this).destroy() || select(this)).remove();
}

function destroyDescendant() {
  const instance = getInstance(this);
  if (instance) { instance.destroy(); }
}

function noop() {} // no operation

export default function (tagName, className) {
  let create = noop;
  let render = noop;
  let destroy = noop;
  let key;

  function component(selection, data, context) {
    const instances = (selection.nodeName ? select(selection) : selection)
      .selectAll(mine)
      .data(dataArray(data, context), key);
    instances
      .exit()
        .each(destroyInstance);
    return instances
      .enter().append(tagName)
        .attr('class', className)
        .each(createInstance)
      .merge(instances)
        .each(render);
  }

  function mine() {
    return Array.from(this.children).filter(belongsToMe);
  }

  function belongsToMe(node) {
    const instance = getInstance(node);
    return instance && instance.owner === component;
  }

  function createInstance(d, i, nodes) {
    const selection = select(this);
    setInstance(this, {
      owner: component,
      destroy: () => destroy.call(this, d, i, nodes),
      selection,
    });
    create(selection, d, i, nodes);
  }

  component.render = (_) => { render = _; return component; };
  component.create = (_) => { create = _; return component; };
  component.destroy = (_) => { destroy = _; return component; };
  component.key = (_) => { key = _; return component; };

  return component;
}
