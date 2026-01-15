async function loadComponent(componentId, filePath, callback = null) {
    const placeholder = document.getElementById(componentId);

    if (placeholder) {
        try {
            const response = await fetch(filePath);
            const html = await response.text();
            
            placeholder.innerHTML = html;
            
            if (callback) {
                callback();
            }
            
        } catch (error) {
            console.error(`Erreur lors du chargement du composant ${filePath} :`, error);
        }
    }
}






function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'member-card';

    card.innerHTML = `
        <div class="card">
            <div class="card-front">
                <img src="assets/images/membres/${member.photo}" alt="Photo de ${member.prenom} ${member.nom}">
                <div class="member-info-footer">
                    <h4>${member.prenom} ${member.nom}</h4>
                    <p>${member.poste}</p>
                </div>
            </div>
            
            <div class="card-back">
                <div class="back-content">
                    <h3>${member.poste}</h3>
                    <h4>${member.prenom} ${member.nom}</h4>
                    <p class="description-back">${member.description}</p>
                </div>
            </div>

        </div>
    `;
    return card;
}

async function loadMembers() {
    const container = document.getElementById('members-container');
    if (!container) return;

    try {
        const response = await fetch('assets/data/membres.json');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const polesData = await response.json();
        
        for (const poleName in polesData) {
            if (polesData.hasOwnProperty(poleName)) {
                
                const poleTitle = document.createElement('h2');
                poleTitle.className = 'pole-title';
                poleTitle.textContent = poleName;
                container.appendChild(poleTitle);

                const poleGrid = document.createElement('section');
                poleGrid.className = 'member-grid';
                
                polesData[poleName].forEach(member => {
                    const card = createMemberCard(member);
                    poleGrid.appendChild(card);
                });

                container.appendChild(poleGrid);
            }
        }

        initMemberInteractivity();

    } catch (error) {
        console.error("Erreur lors du chargement des membres :", error);
        container.innerHTML = "<p>Désolé, impossible de charger la liste des membres pour le moment.</p>";
    }
}


function initMemberInteractivity() {
    document.querySelectorAll('.member-card').forEach(card => {

        card.addEventListener('click', (event) => {

            if (document.getElementById('main-nav')?.classList.contains('active')) {
                if (typeof closeMobileMenu === 'function') { 
                    closeMobileMenu();
                }
            }

            card.classList.toggle('active');
            card.classList.remove('hover-active'); 
            

            event.stopPropagation(); 
        });


        // GESTION DU SURVOL (Hover pour PC uniquement)

        // Survol de la souris (mouseenter)
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('active')) {
                card.classList.add('hover-active');
            }
        });

        // Souris qui quitte (mouseleave)
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover-active');
        });
    });
}


