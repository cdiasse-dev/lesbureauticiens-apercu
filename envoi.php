<?php
/* Les Bureauticiens — réception des formulaires du site (devis et rendez-vous).
 * Envoie la demande par email depuis l'hébergement. Répond en JSON. */
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

$DESTINATAIRE = 'contact@lesbureauticiens.com';
$EXPEDITEUR   = 'site@lesbureauticiens.com';

function fin($code, $data) { http_response_code($code); echo json_encode($data); exit; }
function champ($nom, $max = 300) {
    $v = isset($_POST[$nom]) ? $_POST[$nom] : '';
    if (is_array($v)) $v = implode(', ', array_filter($v, 'is_string'));
    if (!is_string($v)) $v = '';
    $v = str_replace(array("\r", "\0"), '', trim($v));
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}
function ligne($v) { return trim(preg_replace('/\s+/', ' ', $v)); } // jamais de retour à la ligne dans un en-tête
function ou($v) { return $v !== '' ? $v : '—'; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fin(405, array('ok' => false, 'erreur' => 'methode'));
if (champ('_honey') !== '') fin(200, array('ok' => true)); // robot : on fait comme si

$rdv     = champ('_type') === 'rdv';
$nom     = ligne(champ('nom', 120));
$societe = ligne(champ('societe', 120));
$email   = ligne(champ('email', 160));
$tel     = ligne(champ('telephone', 40));
$message = champ('message', 4000);

if (strlen($nom) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) fin(400, array('ok' => false, 'erreur' => 'champs'));

if ($rdv) {
    $titre = 'Demande de rendez-vous';
    $detail = "Date souhaitée : " . ou(ligne(champ('date', 40))) . "\n"
            . "Créneau : " . ou(ligne(champ('creneau', 80))) . "\n"
            . "Type de rendez-vous : " . ou(ligne(champ('type', 120))) . "\n";
} else {
    $titre = 'Demande de devis';
    $detail = "Domaines concernés : " . ou(ligne(champ('domaines', 400))) . "\n"
            . "Formule souhaitée : " . ou(ligne(champ('formule', 60))) . "\n";
}

$corps = "$titre depuis le site\n\n" . $detail . "\n"
  . "Nom : $nom\n"
  . "Société : " . ou($societe) . "\n"
  . "Email : $email\n"
  . "Téléphone : " . ou($tel) . "\n\n"
  . ($message !== '' ? "Message :\n$message\n" : '');

$sujet = '=?UTF-8?B?' . base64_encode("$titre — site web — $nom") . '?=';
$entetes = "From: Site Les Bureauticiens <$EXPEDITEUR>\r\n"
  . "Reply-To: $email\r\n"
  . "MIME-Version: 1.0\r\n"
  . "Content-Type: text/plain; charset=UTF-8\r\n"
  . "Content-Transfer-Encoding: 8bit";

if (@mail($DESTINATAIRE, $sujet, $corps, $entetes, "-f$EXPEDITEUR")) fin(200, array('ok' => true));
fin(500, array('ok' => false, 'erreur' => 'envoi'));
