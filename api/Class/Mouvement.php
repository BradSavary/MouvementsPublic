<?php

class Mouvement implements JsonSerializable {
   
    protected $id;
    private $nom; //Nom d'usage
    private $nom_naissance; // Nouvelle propriété
    private $prenom;
    private $naissance;
    private $sex;
    private $type;
    private $date;
    private ?string $time = null;
    private ?string $lieuDepart = null;
    private ?string $lieuArrivee = null;
    private ?string $chambreDepart = null;
    private ?string $chambreArrivee = null;
    private ?string $sejour = null;

        private ?string $sectionDepart = null;
    private ?string $sectionArrivee = null;
    private $author;

    private bool $checked = false;

    private ?string $checkedBy = null;

    public function __construct($id) {
        $this->id = $id;
    }

    public function getId(): int {
        return $this->id;
    }

    public function jsonSerialize(): array {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'nom_naissance' => $this->nom_naissance,
            'prenom' => $this->prenom,
            'naissance' => $this->naissance,
            'sex' => $this->sex,
            'type' => $this->type,
            'date' => $this->date,
            'time' => $this->time,
            'lieuDepart' => $this->lieuDepart,
            'lieuArrivee' => $this->lieuArrivee,
            'chambreDepart' => $this->chambreDepart,
            'chambreArrivee' => $this->chambreArrivee,
            'sectionDepart' => $this->sectionDepart,
            'sectionArrivee' => $this->sectionArrivee,
            'sejour' => $this->sejour,
            'author' => $this->author,
            'checked' => $this->checked,
            'checkedBy' => $this->checkedBy,
        ];
    }
    public function getAuthor(): ?string {
        return $this->author;
    }

    public function setAuthor(?string $author): void {
        $this->author = $author;
    }

    public function getNom(): string {
        return $this->nom;
    }

    public function setNom(string $nom): void {
        $this->nom = $nom;
    }

    public function getNomNaissance(): string {
        return $this->nom_naissance;
    }

    public function setNomNaissance(string $nom_naissance): void {
        $this->nom_naissance = $nom_naissance;
    }

    public function getPrenom(): string {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): void {
        $this->prenom = $prenom;
    }

    public function getNaissance(): string {
        return $this->naissance;
    }

    public function setNaissance(string $naissance): void {
        $this->naissance = $naissance;
    }

    public function getSex(): string {
        return $this->sex;
    }

    public function setSex(string $sex): void {
        $this->sex = $sex;
    }

    public function getType(): string {
        return $this->type;
    }

    public function setType(string $type): void {
        $this->type = $type;
    }

    public function getDate(): string {
        return $this->date;
    }

    public function setDate(string $date): void {
        $this->date = $date;
    }

    public function getTime(): ?string {
        return $this->time;
    }

    public function setTime(?string $time): void {
        $this->time = $time;
    }

    public function getLieuDepart(): ?string {
        return $this->lieuDepart;
    }

    public function setLieuDepart(?string $lieuDepart): void {
        $this->lieuDepart = $lieuDepart;
    }

    public function getLieuArrivee(): ?string {
        return $this->lieuArrivee;
    }

    public function setLieuArrivee(?string $lieuArrivee): void {
        $this->lieuArrivee = $lieuArrivee;
    }

    public function getChambreDepart(): ?string {
        return $this->chambreDepart;
    }

    public function setChambreDepart(?string $chambreDepart): void {
        $this->chambreDepart = $chambreDepart;
    }

    public function getChambreArrivee(): ?string {
        return $this->chambreArrivee;
    }

    public function setChambreArrivee(?string $chambreArrivee): void {
        $this->chambreArrivee = $chambreArrivee;
    }

    public function getSejour(): ?string {
        return $this->sejour;
    }

    public function setSejour(?string $sejour): void {
        $this->sejour = $sejour;
    }

    public function isChecked(): bool {
        return $this->checked;
    }

    public function setChecked(bool $checked): void {
        $this->checked = $checked;
    }

    public function getCheckedBy(): ?string {
        return $this->checkedBy;
    }

    public function setCheckedBy(?string $checkedBy): void {
        $this->checkedBy = $checkedBy;
    }

        public function getSectionDepart(): ?string {
        return $this->sectionDepart;
    }

    public function setSectionDepart(?string $sectionDepart): void {
        $this->sectionDepart = $sectionDepart;
    }

    public function getSectionArrivee(): ?string {
        return $this->sectionArrivee;
    }

    public function setSectionArrivee(?string $sectionArrivee): void {
        $this->sectionArrivee = $sectionArrivee;
    }
}