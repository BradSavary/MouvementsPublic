export function formatDate(dateString, timeString) {
  if (!dateString) return "";

  const options = { year: "numeric", month: "long", day: "numeric" };
  const date = new Date(dateString);
  let formattedDate = date.toLocaleDateString("fr-FR", options);

  if (timeString) {
    formattedDate += " à " + timeString;
  }

  return formattedDate;
}
