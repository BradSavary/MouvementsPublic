<?php

class Deces implements JsonSerializable {
   
    protected $id;
    private $nom; //Nom d'usage
    private $nom_naissance;
    private $prenom;
    private $naissance;
    private $sex;
    private $date_deces;
    private $heure_deces;
    private $chambre;
    private $author;

    private bool $checked = false;

    private ?string $checkedBy = null;

        private ?string $section = null;

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
            'date_deces' => $this->date_deces,
            'heure_deces' => $this->heure_deces,
            'chambre' => $this->chambre,
            'author' => $this->author,
            'section' => $this->section,
            'checked' => $this->checked,
            'checkedBy' => $this->checkedBy,
        ];
    }

    // Getters et setters
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

    public function getDateDeces(): string {
        return $this->date_deces;
    }

    public function setDateDeces(string $date_deces): void {
        $this->date_deces = $date_deces;
    }

    public function getHeureDeces(): string {
        return $this->heure_deces;
    }

    public function setHeureDeces(string $heure_deces): void {
        $this->heure_deces = $heure_deces;
    }

    public function getChambre(): string {
        return $this->chambre;
    }

    public function setChambre(string $chambre): void {
        $this->chambre = $chambre;
    }

    public function getAuthor(): string {
        return $this->author;
    }

    public function setAuthor(string $author): void {
        $this->author = $author;
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

        public function getSection(): ?string {
        return $this->section;
    }

    public function setSection(?string $section): void {
        $this->section = $section;
    }
}