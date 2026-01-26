import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, PlusCircle, Eye, Edit, Trash2, Download, 
  ChevronLeft, ChevronRight, FileText,
  CreditCard, DollarSign, Calendar, User,
  CheckCircle, XCircle, Filter, X
} from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import StatutBadge from '../components/StatutBadge';

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [showActions, setShowActions] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10
  });

  const actionsRef = useRef(null);

  const statuts = [
    { value: 'TOUS', label: 'Tous les statuts' },
    { value: 'IMPAYEE', label: 'Impayées' },
    { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payées' },
    { value: 'PAYEE', label: 'Payées' }
  ];

  // Gestion du scroll pour les actions mobiles
  useEffect(() => {
    if (showActions && actionsRef.current) {
      actionsRef.current.scrollLeft = 0;
    }
  }, [showActions]);

  const loadFactures = async (page = 0, statut = filterStatut) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (statut === 'TOUS') {
        response = await factureService.getAll(page, 10);
      } else {
        response = await factureService.getByStatut(statut, page, 10);
      }
      
      setFactures(response.data.factures);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        pageSize: 10
      });
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadFactures(0, filterStatut);
      return;
    }

    try {
      setLoading(true);
      const response = await factureService.search(searchTerm, 0, 10);
      setFactures(response.data.factures);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        pageSize: 10
      });
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newStatut = e.target.value;
    setFilterStatut(newStatut);
    loadFactures(0, newStatut);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette facture ?')) {
      return;
    }

    try {
      await factureService.delete(id);
      setSuccess('Facture supprimée avec succès');
      loadFactures();
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setShowActions(null);
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Voulez-vous vraiment supprimer ${selectedIds.length} facture(s) ?`)) {
      return;
    }

    try {
      await factureService.deleteMultiple(selectedIds);
      setSuccess(`${selectedIds.length} facture(s) supprimée(s) avec succès`);
      loadFactures();
      setSelectedIds([]);
    } catch (err) {
      setError('Erreur lors de la suppression multiple');
    }
  };

  const handleDownloadPdf = async (id, numeroFacture) => {
    try {
      const response = await factureService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${numeroFacture}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowActions(null);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === factures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(factures.map(f => f.id));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < pagination.totalPages) {
      loadFactures(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'PAYEE':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'PARTIELLEMENT_PAYEE':
        return <div className="h-2 w-2 rounded-full bg-yellow-500"></div>;
      case 'IMPAYEE':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const toggleActions = (factureId) => {
    setShowActions(showActions === factureId ? null : factureId);
  };

  useEffect(() => {
    loadFactures();
  }, []);

  if (loading && factures.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
      {/* Header avec recherche et filtres VISIBLES DIRECTEMENT */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Factures</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">Gestion des factures</p>
          </div>
          
          {/* Bouton nouvelle facture mobile */}
          <Link
            to="/factures/new"
            className="sm:hidden btn btn-primary p-2 text-white"
            aria-label="Nouvelle facture"
          >
            <PlusCircle size={20} />
          </Link>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES TOUJOURS VISIBLES */}
        <div className="space-y-3">
          {/* Filtre statut - visible sur mobile et desktop */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              value={filterStatut}
              onChange={handleFilterChange}
              className="input-field pl-10 w-full py-3 text-sm sm:text-base appearance-none"
            >
              {statuts.map(statut => (
                <option key={statut.value} value={statut.value}>
                  {statut.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Recherche - visible sur mobile et desktop */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher facture ou client..."
                className="input-field pl-10 w-full py-3 text-sm sm:text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    loadFactures(0, filterStatut);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="btn btn-primary flex items-center gap-2 px-4 py-3"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </div>
        </div>

        {/* Bouton nouvelle facture desktop */}
        <div className="hidden sm:flex justify-end">
          <Link
            to="/factures/new"
            className="btn btn-primary flex items-center justify-center gap-2 px-4 py-3"
          >
            <PlusCircle size={18} />
            <span>Nouvelle facture</span>
          </Link>
        </div>
      </div>

      {/* Messages d'alerte */}
      {error && <ErrorAlert message={error} onRetry={() => loadFactures()} />}
      {success && <SuccessAlert message={success} />}

      {/* Actions multiples */}
      {selectedIds.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-100 p-1.5 rounded-lg">
                <CheckCircle size={16} className="text-yellow-600" />
              </div>
              <span className="font-medium text-yellow-800 text-sm">
                {selectedIds.length} facture(s) sélectionnée(s)
              </span>
            </div>
            <button
              onClick={handleDeleteMultiple}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 w-full sm:w-auto justify-center py-2 text-sm"
            >
              <Trash2 size={16} />
              <span>Supprimer la sélection</span>
            </button>
          </div>
        </div>
      )}

      {/* Liste des factures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tableau desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={factures.length > 0 && selectedIds.length === factures.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reste
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factures.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="mx-auto mb-3 text-gray-400" size={40} />
                      <p className="text-gray-600 mb-2">Aucune facture trouvée</p>
                      <Link to="/factures/new" className="text-primary-600 hover:text-primary-800 font-medium">
                        Créer votre première facture
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                factures.map((facture) => (
                  <tr 
                    key={facture.id} 
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(facture.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(facture.id)}
                        onChange={() => toggleSelect(facture.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        to={`/factures/${facture.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-2"
                      >
                        <FileText size={14} className="text-gray-400" />
                        {facture.numeroFacture}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(facture.dateFacturation)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-xs">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{facture.nomClient}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {formatMontant(facture.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-500" />
                        <span>{formatMontant(facture.montantPaye || 0)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold">
                      <span className={facture.resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatMontant(facture.resteAPayer || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={facture.statutPaiement} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/factures/${facture.id}`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/factures/${facture.id}/edit`}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </Link>
                        <Link
                          to={`/factures/${facture.id}/paiements`}
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                          title="Paiements"
                        >
                          <CreditCard size={16} />
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(facture.id, facture.numeroFacture)}
                          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(facture.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Liste mobile/tablette */}
        <div className="lg:hidden">
          {factures.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <FileText className="mx-auto mb-3 text-gray-400" size={40} />
              <p className="text-gray-600 mb-2">Aucune facture trouvée</p>
              <Link to="/factures/new" className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                Créer votre première facture
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {factures.map((facture) => (
                <div 
                  key={facture.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${selectedIds.includes(facture.id) ? 'bg-blue-50' : ''}`}
                  onClick={(e) => {
                    // Empêche l'ouverture des actions si on clique sur un lien
                    if (!e.target.closest('a') && !e.target.closest('button') && !e.target.closest('input')) {
                      toggleActions(facture.id);
                    }
                  }}
                >
                  {/* En-tête de la facture */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(facture.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(facture.id);
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 flex-shrink-0 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/factures/${facture.id}`}
                            className="font-medium text-primary-600 truncate text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {facture.numeroFacture}
                          </Link>
                          <div className="flex-shrink-0">
                            {getStatusIcon(facture.statutPaiement)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar size={12} />
                          <span>{formatDate(facture.dateFacturation)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bouton pour afficher/masquer les actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActions(facture.id);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Actions"
                    >
                      {showActions === facture.id ? (
                        <X size={18} />
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <div className="h-0.5 w-3 bg-gray-400"></div>
                          <div className="h-0.5 w-3 bg-gray-400"></div>
                          <div className="h-0.5 w-3 bg-gray-400"></div>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Informations client */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <User size={12} className="text-gray-400" />
                      <span className="font-medium truncate">{facture.nomClient}</span>
                    </div>
                  </div>
                  
                  {/* Montants */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-medium">{formatMontant(facture.total)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Payé</div>
                      <div className="font-medium text-green-600">{formatMontant(facture.montantPaye || 0)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Reste à payer</div>
                      <div className={`font-bold ${facture.resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMontant(facture.resteAPayer || 0)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div>
                        <StatutBadge statut={facture.statutPaiement} />
                      </div>
                    </div>
                  </div>

                  {/* BANDEAU D'ACTIONS SCROLLABLE */}
                  {showActions === facture.id && (
                    <div 
                      ref={actionsRef}
                      className="mt-3 overflow-x-auto scrollbar-hide pb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2 min-w-max">
                        <Link
                          to={`/factures/${facture.id}`}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-lg min-w-[80px] hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={18} />
                          <span className="text-xs font-medium">Voir</span>
                        </Link>
                        
                        <Link
                          to={`/factures/${facture.id}/edit`}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-green-50 text-green-700 rounded-lg min-w-[80px] hover:bg-green-100 transition-colors"
                        >
                          <Edit size={18} />
                          <span className="text-xs font-medium">Modifier</span>
                        </Link>
                        
                        <Link
                          to={`/factures/${facture.id}/paiements`}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-purple-50 text-purple-700 rounded-lg min-w-[80px] hover:bg-purple-100 transition-colors"
                        >
                          <CreditCard size={18} />
                          <span className="text-xs font-medium">Paiements</span>
                        </Link>
                        
                        <button
                          onClick={() => handleDownloadPdf(facture.id, facture.numeroFacture)}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-gray-50 text-gray-700 rounded-lg min-w-[80px] hover:bg-gray-100 transition-colors"
                        >
                          <Download size={18} />
                          <span className="text-xs font-medium">PDF</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(facture.id)}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-red-50 text-red-700 rounded-lg min-w-[80px] hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={18} />
                          <span className="text-xs font-medium">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination améliorée */}
        {pagination.totalPages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-gray-700">
                Page <span className="font-medium">{pagination.currentPage + 1}</span>
                sur <span className="font-medium">{pagination.totalPages}</span>
                • <span className="font-medium">{factures.length}</span> factures
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 0}
                  className={`p-1.5 rounded-lg ${
                    pagination.currentPage === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {/* Pagination mobile simplifiée */}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(3, pagination.totalPages)).keys()].map((i) => {
                    const pageNum = pagination.currentPage + i;
                    if (pageNum < pagination.totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 text-xs rounded-lg ${
                            pagination.currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages - 1}
                  className={`p-1.5 rounded-lg ${
                    pagination.currentPage === pagination.totalPages - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Page suivante"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureList;