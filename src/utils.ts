export function formatThousands(num: number | string): number | string {
	if (+num < 1000) {
	  return num;
	}
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}