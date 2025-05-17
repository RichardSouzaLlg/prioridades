document.addEventListener('DOMContentLoaded', function() {
    
    const themeBtn = document.getElementById('themeBtn');
    const roomLinks = document.querySelectorAll('.menu a[data-room]');
    const budgetLink = document.getElementById('budgetLink');
    const itemsSection = document.querySelector('.items-section');
    const budgetSection = document.querySelector('.budget-section');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemModal = document.getElementById('itemModal');
    const closeModal = document.querySelector('.close-modal');
    const itemForm = document.getElementById('itemForm');
    const itemsList = document.querySelector('.items-list');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    const currentRoom = document.getElementById('currentRoom');
    const calculateBtn = document.getElementById('calculateBtn');
    const remainingBudget = document.getElementById('remainingBudget');

        // Variáveis de estado
        let currentRoomFilter = 'all';
        let items = JSON.parse(localStorage.getItem('morarSozinhoItems')) || [];
        let budget = JSON.parse(localStorage.getItem('morarSozinhoBudget')) || {
            salary: 0,
            expenses: 0,
            savings: 0,
            remaining: 0
        };

    // Inicialização
    loadBudget();
    renderItems();
    updateRoomTitle('all');

    // Event Listeners
    themeBtn.addEventListener('click', toggleTheme);
    budgetLink.addEventListener('click', toggleBudgetSection);
    addItemBtn.addEventListener('click', openItemModal);
    closeModal.addEventListener('click', closeItemModal);
    itemForm.addEventListener('submit', handleItemSubmit);
    filterStatus.addEventListener('change', renderItems);
    searchInput.addEventListener('input', renderItems);
    calculateBtn.addEventListener('click', calculateBudget);

    // Fechar modal ao clicar fora
    itemModal.addEventListener('click', function(e) {
        if (e.target === itemModal) {
            closeItemModal();
        }
    });

    // Navegação por cômodos
    roomLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const room = this.getAttribute('data-room');
            currentRoomFilter = room;
            updateRoomTitle(room);
            toggleBudgetSection(true);
            renderItems();
            
            // Atualizar menu ativo
            roomLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Funções
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeBtn.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('morarSozinhoTheme', newTheme);
    }

    function toggleBudgetSection(forceClose = false) {
        if (forceClose || !budgetSection.classList.contains('hidden')) {
            budgetSection.classList.add('hidden');
            itemsSection.classList.remove('hidden');
        } else {
            budgetSection.classList.remove('hidden');
            itemsSection.classList.add('hidden');
        }
    }

    function openItemModal() {
        itemModal.classList.remove('hidden');
    }

    function closeItemModal() {
        itemModal.classList.add('hidden');
        itemForm.reset();
    }

    function handleItemSubmit(e) {
        e.preventDefault();
        
        const itemName = document.getElementById('itemName').value;
        const itemRoom = document.getElementById('itemRoom').value;
        const itemPriority = document.getElementById('itemPriority').value;
        const itemLink = document.getElementById('itemLink').value;
        const itemNotes = document.getElementById('itemNotes').value;
        
        const newItem = {
            id: Date.now(),
            name: itemName,
            room: itemRoom,
            priority: itemPriority,
            link: itemLink,
            notes: itemNotes,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        items.push(newItem);
        saveItems();
        renderItems();
        closeItemModal();
    }

    function renderItems() {
        itemsList.innerHTML = '';
        
        let filteredItems = [...items];
        
        // Filtrar por cômodo
        if (currentRoomFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.room === currentRoomFilter);
        }
        
        // Filtrar por status
        const statusFilter = filterStatus.value;
        if (statusFilter === 'pending') {
            filteredItems = filteredItems.filter(item => !item.completed);
        } else if (statusFilter === 'completed') {
            filteredItems = filteredItems.filter(item => item.completed);
        }
        
        // Filtrar por pesquisa
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(searchTerm) || 
                (item.notes && item.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        // Ordenar por prioridade e data de criação
        filteredItems.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        if (filteredItems.length === 0) {
            itemsList.innerHTML = '<p class="no-items">Nenhum item encontrado.</p>';
            return;
        }
        
        filteredItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = `item-card ${getPriorityClass(item.priority)} ${item.completed ? 'completed' : ''}`;
            
            const roomNames = {
                living: 'Sala',
                kitchen: 'Cozinha',
                bedroom: 'Quarto',
                bathroom: 'Banheiro',
                laundry: 'Lavanderia'
            };
            
            itemCard.innerHTML = `
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    <span class="item-room">${roomNames[item.room]}</span>
                </div>
                ${item.link ? `<a href="${item.link}" target="_blank" class="item-link">${truncateLink(item.link)}</a>` : ''}
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                <div class="item-actions">
                    <button class="toggle-complete" data-id="${item.id}">
                        <i class="fas fa-${item.completed ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="delete-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            itemsList.appendChild(itemCard);
        });
        
        // Adicionar event listeners aos botões
        document.querySelectorAll('.toggle-complete').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleItemComplete(this.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteItem(this.getAttribute('data-id'));
            });
        });
    }

    function toggleItemComplete(id) {
        items = items.map(item => {
            if (item.id == id) {
                return {...item, completed: !item.completed};
            }
            return item;
        });
        saveItems();
        renderItems();
    }

    function deleteItem(id) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            items = items.filter(item => item.id != id);
            saveItems();
            renderItems();
        }
    }

    function getPriorityClass(priority) {
        switch(priority) {
            case '1': return 'high';
            case '3': return 'low';
            default: return 'medium';
        }
    }

    function truncateLink(link, maxLength = 40) {
        if (link.length > maxLength) {
            return link.substring(0, maxLength) + '...';
        }
        return link;
    }

    function saveItems() {
        localStorage.setItem('morarSozinhoItems', JSON.stringify(items));
    }

    function updateRoomTitle(room) {
        const roomTitles = {
            all: 'Todos os Itens',
            living: 'Itens da Sala',
            kitchen: 'Itens da Cozinha',
            bedroom: 'Itens do Quarto',
            bathroom: 'Itens do Banheiro',
            laundry: 'Itens para reforma'
        };
        currentRoom.textContent = roomTitles[room];
    }

    function loadBudget() {
        document.getElementById('salary').value = budget.salary;
        document.getElementById('expenses').value = budget.expenses;
        document.getElementById('savings').value = budget.savings;
        updateBudgetDisplay();
    }

    function calculateBudget() {
        const salary = parseFloat(document.getElementById('salary').value) || 0;
        const expenses = parseFloat(document.getElementById('expenses').value) || 0;
        const savings = parseFloat(document.getElementById('savings').value) || 0;
        
        const remaining = salary - expenses - savings;
        
        budget = {
            salary,
            expenses,
            savings,
            remaining
        };
        
        localStorage.setItem('morarSozinhoBudget', JSON.stringify(budget));
        updateBudgetDisplay();
    }

    function updateBudgetDisplay() {
        const formatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        remainingBudget.textContent = `Valor Disponível: ${formatter.format(budget.remaining)}`;
    }

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('morarSozinhoTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeBtn.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});
