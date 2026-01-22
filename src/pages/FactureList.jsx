import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, PlusCircle, Eye, Edit, Trash2, Download, 
  ChevronLeft, ChevronRight, FileText, MoreVertical,
  Filter
} from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10
  });

  const loadFactures = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await factureService.getAll(page, 10);
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
      loadFactures();
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
      setShowSearch(false);
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
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
      setShowActionsMenu(null);
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
      setShowActionsMenu(null);
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

  useEffect(() => {
    loadFactures();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  if (loading && factures.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec recherche mobile */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Factures</h1>
            <p className="text-xs sm:text-sm text-gray-600">Gestion des factures clients</p>
          </div>
          
          {/* Boutons actions mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-600 hover:text-gray-900"
              aria-label="Rechercher"
            >
              <Search size={20} />
            </button>
            <Link
              to="/factures/new"
              className="btn btn-primary p-2"
              aria-label="Nouvelle facture"
            >
              <PlusCircle size={20} />
            </Link>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        {showSearch && (
          <div className="sm:hidden bg-white p-3 rounded-lg shadow">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher..."
                className="input-field flex-1 text-sm"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="btn btn-primary px-3"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Barre de recherche desktop */}
        <div className="hidden sm:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher facture ou client..."
              className="input-field flex-1"
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary flex items-center gap-2"
            >
              <Search size={18} />
              <span>Rechercher</span>
            </button>
          </div>
          
          <Link
            to="/factures/new"
            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="font-medium text-yellow-800 text-sm sm:text-base">
              {selectedIds.length} facture(s) sélectionnée(s)
            </span>
            <button
              onClick={handleDeleteMultiple}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Trash2 size={18} />
              <span>Supprimer la sélection</span>
            </button>
          </div>
        </div>
      )}

      {/* Liste des factures */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tableau desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={factures.length > 0 && selectedIds.length === factures.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">N° Facture</th>
                <th className="table-header">Date</th>
                <th className="table-header">Client</th>
                <th className="table-header">Montant</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                    <p>Aucune facture trouvée</p>
                    <Link to="/factures/new" className="text-primary-600 hover:underline">
                      Créer votre première facture
                    </Link>
                  </td>
                </tr>
              ) : (
                factures.map((facture) => (
                  <tr 
                    key={facture.id} 
                    className={`hover:bg-gray-50 ${selectedIds.includes(facture.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(facture.id)}
                        onChange={() => toggleSelect(facture.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="table-cell font-medium">
                      <Link 
                        to={`/factures/${facture.id}`}
                        className="text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {facture.numeroFacture}
                      </Link>
                    </td>
                    <td className="table-cell">
                      {formatDate(facture.dateFacturation)}
                    </td>
                    <td className="table-cell">
                      {facture.nomClient}
                    </td>
                    <td className="table-cell font-medium">
                      {formatMontant(facture.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/factures/${facture.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Voir"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/factures/${facture.id}/edit`}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(facture.id, facture.numeroFacture)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Télécharger PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(facture.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Liste mobile */}
        <div className="sm:hidden">
          {factures.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <FileText className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="mb-2">Aucune facture trouvée</p>
              <Link to="/factures/new" className="text-primary-600 hover:underline text-sm">
                Créer votre première facture
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {factures.map((facture) => (
                <div 
                  key={facture.id} 
                  className={`p-4 ${selectedIds.includes(facture.id) ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(facture.id)}
                        onChange={() => toggleSelect(facture.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <Link 
                        to={`/factures/${facture.id}`}
                        className="font-medium text-primary-600"
                      >
                        {facture.numeroFacture}
                      </Link>
                    </div>
                    
                    {/* Menu actions mobile */}
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === facture.id ? null : facture.id)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                        aria-label="Actions"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {showActionsMenu === facture.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <Link
                              to={`/factures/${facture.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowActionsMenu(null)}
                            >
                              <Eye size={16} />
                              Voir
                            </Link>
                            <Link
                              to={`/factures/${facture.id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowActionsMenu(null)}
                            >
                              <Edit size={16} />
                              Modifier
                            </Link>
                            <button
                              onClick={() => handleDownloadPdf(facture.id, facture.numeroFacture)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Download size={16} />
                              Télécharger PDF
                            </button>
                            <button
                              onClick={() => handleDelete(facture.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Client:</span>
                      <span className="text-sm font-medium">{facture.nomClient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Date:</span>
                      <span className="text-sm">{formatDate(facture.dateFacturation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Montant:</span>
                      <span className="text-sm font-medium">{formatMontant(facture.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-3 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Page <span className="font-medium">{pagination.currentPage + 1}</span>
                sur <span className="font-medium">{pagination.totalPages}</span>
                • <span className="font-medium">{factures.length}</span> factures
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 0}
                  className={`p-1 sm:p-2 rounded ${
                    pagination.currentPage === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(3, pagination.totalPages)).keys()].map((i) => {
                    const pageNum = pagination.currentPage + i;
                    if (pageNum < pagination.totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
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
                  className={`p-1 sm:p-2 rounded ${
                    pagination.currentPage === pagination.totalPages - 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Page suivante"
                >
                  <ChevronRight size={20} />
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