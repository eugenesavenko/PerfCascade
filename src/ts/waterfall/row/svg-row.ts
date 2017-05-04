// import { getLastItemOfNodeList } from "../../helpers/dom";
import * as icons from "../../helpers/icons";
import {
  isTabDown,
  isTabUp,
  resourceUrlFormatter,
} from "../../helpers/misc";
import * as svg from "../../helpers/svg";
import { Context } from "../../typing/context";
import { RectData } from "../../typing/rect-data";
import { WaterfallEntry } from "../../typing/waterfall";
import { getIndicatorIcons } from "./svg-indicators";
import * as rowSubComponents from "./svg-row-subcomponents";

// initial clip path
const clipPathElProto = svg.newClipPath("titleClipPath");
clipPathElProto.appendChild(svg.newRect({
  "height": "100%",
  "width": "100%",
}));

const ROW_LEFT_MARGIN = 3;

// Create row for a single request
export function createRow(context: Context, index: number,
                          maxIconsWidth: number, maxNumberWidth: number,
                          rectData: RectData, entry: WaterfallEntry,
                          onDetailsOverlayShow: EventListener): SVGAElement {

  const y = rectData.y;
  const rowHeight = rectData.height;
  const leftColumnWith = context.options.leftColumnWith;
  let rowItem = svg.newA(entry.responseDetails.rowClass);
  rowItem.setAttribute("href", "javascript:void(0)");
  let leftFixedHolder = svg.newSvg("left-fixed-holder", {
    "width": `${leftColumnWith}%`,
    "x": "0",
  });
  let flexScaleHolder = svg.newSvg("flex-scale-waterfall", {
    "width": `${100 - leftColumnWith}%`,
    "x": `${leftColumnWith}%`,
  });

  let rect = rowSubComponents.createRect(rectData, entry.segments, entry.total);
  let rowName = rowSubComponents.createNameRowBg(y, rowHeight);
  let rowBar = rowSubComponents.createRowBg(y, rowHeight);
  let bgStripe = rowSubComponents.createBgStripe(y, rowHeight, (index % 2 === 0));

  let x = ROW_LEFT_MARGIN + maxIconsWidth;

  if (context.options.showMimeTypeIcon) {
    const icon = entry.responseDetails.icon;
    x -= icon.width;
    rowName.appendChild(icons[icon.type](x, y + 3, icon.title));
  }

  if (context.options.showIndicatorIcons) {
    // Create and add warnings for potentia;l issues
    getIndicatorIcons(entry).forEach((icon) => {
      x -= icon.width;
      rowName.appendChild(icons[icon.type](x, y + 3, icon.title));
    });
  }

  // Jump to the largest offset of all rows
  x = ROW_LEFT_MARGIN + maxIconsWidth;

  let requestNumber = `${index + 1}`;

  const requestNumberLabel = rowSubComponents.createRequestNumberLabel(x, y, requestNumber, rowHeight, maxNumberWidth);
  // 4 is slightly bigger than the hover "glow" around the url
  x += maxNumberWidth + 4;
  let shortLabel = rowSubComponents.createRequestLabelClipped(x, y, resourceUrlFormatter(entry.url, 40),
    rowHeight);
  let fullLabel = rowSubComponents.createRequestLabelFull(x, y, entry.url, rowHeight);

  // create and attach request block
  rowBar.appendChild(rect);

  rowSubComponents.appendRequestLabels(rowName, requestNumberLabel, shortLabel, fullLabel);

  context.pubSub.subscribeToSpecificOverlayChanges(index, (change) => {
    hasOpenOverlay = (change.type === "open");
  });
  if (index > 0) {
    context.pubSub.subscribeToSpecificOverlayChanges(index - 1, (change) => {
      hasPrevOpenOverlay = (change.type === "open");
    });
  }

  let hasOpenOverlay: boolean;
  let hasPrevOpenOverlay: boolean;

  rowItem.addEventListener("click", (evt: MouseEvent) => {
    onDetailsOverlayShow(evt);
  });
  rowItem.addEventListener("keydown", (evt: KeyboardEvent) => {
    // on enter
    if (evt.which === 32) {
      return onDetailsOverlayShow(evt);
    }

    // tab without open overlays around
    if (isTabUp(evt) && !hasPrevOpenOverlay && index > 0) {
      rowItem.previousSibling.previousSibling.lastChild.lastChild.dispatchEvent(new MouseEvent("mouseenter"));
      return;
    }
    if (isTabDown(evt) && !hasOpenOverlay) {
      if (rowItem.nextSibling && rowItem.nextSibling.nextSibling) {
        rowItem.nextSibling.nextSibling.lastChild.lastChild.dispatchEvent(new MouseEvent("mouseenter"));
      }
      return;
    }
  });

  rowItem.addEventListener("focusout", () => {
    rowName.dispatchEvent(new MouseEvent("mouseleave"));
  });

  flexScaleHolder.appendChild(rowBar);
  leftFixedHolder.appendChild(clipPathElProto.cloneNode(true));
  leftFixedHolder.appendChild(rowName);

  rowItem.appendChild(bgStripe);
  rowItem.appendChild(flexScaleHolder);
  rowItem.appendChild(leftFixedHolder);

  return rowItem;
}
