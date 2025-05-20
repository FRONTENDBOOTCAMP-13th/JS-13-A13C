import { submitCard, renderScoreTables } from "./winning-point";

submitCard(1, "가나다", 3);
submitCard(1, "라마바", 3);
submitCard(1, "사아자", 5);
submitCard(1, "차카타", 5);

submitCard(2, "가나다", 2);
submitCard(2, "라마바", 4);
submitCard(2, "사아자", 2);
submitCard(2, "차카타", 8);

submitCard(3, "가나다", 1);
submitCard(3, "라마바", 2);
submitCard(3, "사아자", 3);
submitCard(3, "차카타", 1);

window.onload = () => {
  renderScoreTables();
};
