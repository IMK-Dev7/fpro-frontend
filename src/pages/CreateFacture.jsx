import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, ArrowLeft, FileText, 
  Download, Eye, X, CheckCircle, DollarSign, Calendar
} from 'lucide-react';
import { factureService } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const CreateFacture = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [factureCreee, setFactureCreee] = useState(null);
  const [showActions, setShowActions] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      nomClient: '',
      lignes: [
        { quantite: 1, designation: '', prixUnitaire: 0 }
      ]
    }
  });

  const lignes = watch('lignes') || [];

  // Ouvrir automatiquement le PDF après création
  useEffect(() => {
    if (factureCreee) {
      const timer = setTimeout(() => {
        handleViewPdf(factureCreee.id, factureCreee.numeroFacture);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [factureCreee]);

  const addLigne = () => {
    const newLignes = [...lignes, { quantite: 1, designation: '', prixUnitaire: 0 }];
    setValue('lignes', newLignes);
  };

  const removeLigne = (index) => {
    if (lignes.length <= 1) {
      setError('Une facture doit avoir au moins une ligne');
      return;
    }
    const newLignes = lignes.filter((_, i) => i !== index);
    setValue('lignes', newLignes);
  };

  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setValue('lignes', newLignes);
  };

  const calculateTotal = () => {
    return lignes.reduce((total, ligne) => {
      const quantite = parseInt(ligne.quantite) || 0;
      const prix = parseFloat(ligne.prixUnitaire) || 0;
      return total + (quantite * prix);
    }, 0);
  };

  const handleViewPdf = async (factureId, numeroFacture) => {
    try {
      const response = await factureService.viewPdf(factureId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError('Erreur lors de l\'ouverture du PDF');
      console.error(err);
    }
  };

  const handleDownloadPdf = async (factureId, numeroFacture) => {
    try {
      const response = await factureService.downloadPdf(factureId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${numeroFacture}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
      console.error(err);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const onSubmit = async (data) => {
    const invalidLignes = data.lignes.filter(l => 
      !l.designation.trim() || 
      !l.quantite || 
      l.quantite <= 0 || 
      !l.prixUnitaire || 
      l.prixUnitaire < 0
    );

    if (invalidLignes.length > 0) {
      setError('Veuillez remplir correctement toutes les lignes');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setFactureCreee(null);

    try {
      const factureData = {
        nomClient: data.nomClient,
        lignes: data.lignes.map(ligne => ({
          quantite: parseInt(ligne.quantite),
          designation: ligne.designation.trim(),
          prixUnitaire: parseFloat(ligne.prixUnitaire)
        }))
      };

      const response = await factureService.create(factureData);
      const nouvelleFacture = response.data;
      setFactureCreee(nouvelleFacture);
      setSuccess(`Facture créée avec succès !`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la facture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  // Format date pour affichage
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        {/* Bouton retour */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/factures')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 -ml-2"
          >
            <ArrowLeft size={20} />
            <span className="text-sm sm:text-base">Retour</span>
          </button>
          
          {/* Titre version mobile */}
          <h1 className="text-xl font-bold text-gray-900 sm:hidden">Nouvelle Facture</h1>
        </div>
        
        {/* Titre et description */}
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle Facture</h1>
          <p className="text-gray-600">Remplissez les informations de la facture</p>
        </div>
      </div>

      {/* Messages d'alerte */}
      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      {/* Section après création réussie */}
      {factureCreee && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Facture créée avec succès !</h3>
              </div>
              
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-600" />
                  <span className="font-medium">Numéro :</span>
                  <span className="font-bold">{factureCreee.numeroFacture}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Client :</span>
                  <span className="font-bold">{factureCreee.nomClient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-green-600" />
                  <span className="font-medium">Date :</span>
                  <span className="font-bold">{formatDate(factureCreee.dateFacturation)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="font-medium">Total :</span>
                  <span className="font-bold text-lg">{formatMontant(factureCreee.total)} FCFA</span>
                </div>
              </div>
            </div>
            
            {/* Actions PDF - version mobile compacte */}
            <div className="w-full sm:w-auto">
              <div className={`${showActions ? 'block' : 'hidden sm:block'}`}>
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                  <button
                    onClick={() => handleViewPdf(factureCreee.id, factureCreee.numeroFacture)}
                    className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline">Ouvrir</span>
                    <span className="sm:hidden">Voir</span>
                  </button>
                  
                  <button
                    onClick={() => handleDownloadPdf(factureCreee.id, factureCreee.numeroFacture)}
                    className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <Download size={16} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
              
              {/* Bouton toggle actions sur mobile */}
              <button
                onClick={() => setShowActions(!showActions)}
                className="sm:hidden w-full mt-2 btn btn-secondary flex items-center justify-center gap-2 py-2.5"
              >
                {showActions ? <X size={16} /> : <FileText size={16} />}
                <span>{showActions ? 'Masquer' : 'Actions PDF'}</span>
              </button>
            </div>
          </div>
          
          {/* Actions après création */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-green-200">
            <button
              onClick={() => {
                reset();
                setFactureCreee(null);
                setSuccess(null);
                setShowActions(false);
              }}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              Nouvelle facture
            </button>
            
            <button
              onClick={() => navigate(`/factures/${factureCreee.id}`)}
              className="btn bg-green-600 text-white hover:bg-green-700 flex-1 sm:flex-none"
            >
              Voir détails
            </button>
            
            <button
              onClick={() => navigate('/factures')}
              className="btn btn-secondary flex-1 sm:flex-none"
            >
              Liste
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {!factureCreee && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
          {/* Informations Client */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Informations Client</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Client *
              </label>
              <input
                {...register('nomClient', { 
                  required: 'Le nom du client est obligatoire',
                  minLength: { value: 2, message: 'Minimum 2 caractères' }
                })}
                type="text"
                className="input-field w-full py-2.5 sm:py-3 text-sm sm:text-base"
                placeholder="Entrez le nom du client"
              />
              {errors.nomClient && (
                <p className="mt-1 text-sm text-red-600">{errors.nomClient.message}</p>
              )}
            </div>
          </div>

          {/* Lignes de Facture */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Lignes de Facture</h2>
              <button
                type="button"
                onClick={addLigne}
                className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center py-2.5"
              >
                <Plus size={18} />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {lignes.map((ligne, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Ligne {index + 1}
                      </span>
                    </div>
                    {lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Quantité */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                        className="input-field w-full py-2 text-sm sm:text-base"
                        placeholder="1"
                      />
                    </div>

                    {/* Désignation */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Désignation *
                      </label>
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                        className="input-field w-full py-2 text-sm sm:text-base"
                        placeholder="Description du produit/service"
                      />
                    </div>

                    {/* Prix unitaire */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Prix unitaire *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={ligne.prixUnitaire}
                          onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                          className="input-field w-full py-2 pr-10 text-sm sm:text-base"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                          FCFA
                        </div>
                      </div>
                    </div>

                    {/* Montant calculé */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Montant
                      </label>
                      <div className="input-field bg-gray-50 w-full py-2 text-sm sm:text-base flex items-center justify-between">
                        <span className="font-medium">
                          {formatMontant((parseInt(ligne.quantite) || 0) * (parseFloat(ligne.prixUnitaire) || 0))}
                        </span>
                        <span className="text-gray-500 text-xs">FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Total de la facture</h2>
                <p className="text-xs sm:text-sm text-gray-600">Montant total à facturer</p>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary-600">
                {formatMontant(total)} FCFA
              </div>
            </div>
            
            <div className="text-xs sm:text-sm text-gray-600">
              {total > 0 ? (
                <p>Montant total: <span className="font-medium">{formatMontant(total)} Francs CFA</span></p>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle size={16} />
                  <p>Ajoutez des lignes pour calculer le total</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 -mx-3 sm:-mx-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/factures')}
                  className="btn btn-secondary order-2 sm:order-1 py-2.5"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center gap-2 justify-center order-1 sm:order-2 py-2.5"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span className="text-sm sm:text-base">Créer la facture</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// Composant AlertCircle manquant
const AlertCircle = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default CreateFacture;