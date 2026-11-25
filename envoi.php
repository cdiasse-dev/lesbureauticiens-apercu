<?php
/* Les Bureauticiens — réception des demandes de devis.
 * Reçoit le formulaire du site et l'envoie par email. Répond en JSON. */
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

$DESTINATAIRE = 'direction@lesbureauticiens.com';
$EXPEDITEUR   = 'site@lesbureauticiens.com';

function fin($code, $data) { http_response_code($code); echo json_encode($data); exit; }
function champ($nom, $max = 300) {
    $v = isset($_POST[$nom]) && is_string($_POST[$nom]) ? trim($_POST[$nom]) : '';
    $v = str_replace(array("\r", "\0"), '', $v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}
function ligne($v) { return trim(preg_replace('/\s+/', ' ', $v)); } // jamais de retour à la ligne dans un en-tête

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fin(405, array('ok' => false, 'erreur' => 'methode'));
if (champ('_honey') !== '') fin(200, array('ok' => true)); // robot : on fait comme si

$nom     = ligne(champ('nom', 120));
$societe = ligne(champ('societe', 120));
$email   = ligne(champ('email', 160));
$tel     = ligne(champ('tel', 40));
$besoin  = ligne(champ('besoin', 300));
$formule = ligne(champ('formule', 60));
$taille  = ligne(champ('taille', 60));
$delai   = ligne(champ('delai', 60));
$message = champ('message', 4000);

if (strlen($nom) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) fin(400, array('ok' => false, 'erreur' => 'champs'));

$corps = "Nouvelle demande de devis depuis le site\n\n"
  . "Besoin(s) : " . ($besoin !== '' ? $besoin : '—') . "\n"
  . "Formule : "   . ($formule !== '' ? $formule : '—') . "\n"
  . "Taille : "    . ($taille !== '' ? $taille : '—') . "\n"
  . "Échéance : "  . ($delai !== '' ? $delai : '—') . "\n\n"
  . "Nom : $nom\n"
  . "Société : "   . ($societe !== '' ? $societe : '—') . "\n"
  . "Email : $email\n"
  . "Téléphone : " . ($tel !== '' ? $tel : '—') . "\n\n"
  . ($message !== '' ? "Message :\n$message\n" : '');

$sujet = '=?UTF-8?B?' . base64_encode('Demande de devis — ' . ($besoin !== '' ? $besoin : $nom)) . '?=';
$entetes = "From: Site Les Bureauticiens <$EXPEDITEUR>\r\n"
  . "Reply-To: $email\r\n"
  . "MIME-Version: 1.0\r\n"
  . "Content-Type: text/plain; charset=UTF-8\r\n"
  . "Content-Transfer-Encoding: 8bit";

if (@mail($DESTINATAIRE, $sujet, $corps, $entetes, "-f$EXPEDITEUR")) fin(200, array('ok' => true));
fin(500, array('ok' => false, 'erreur' => 'envoi'));
