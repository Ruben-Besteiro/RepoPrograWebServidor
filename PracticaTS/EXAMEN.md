1. Los dos tienen problemillas pero el más incorrecto es el del cliente porque no hay objeto filter, por lo que cualquier usuario puede verlo todo. El del albarán tiene otro problema que es que la compañía que se va a buscar viene en la query, por lo que si el usuario mete una compañía que no es la suya, puede espiar a esa compañía. Lo que habría que hacer es rellenar el campo compañía con req.user.company para que solo pueda ver la compañía a la que pertenece.

2. Funcionará pero no es buena práctica. Lo que se puede hacer es sacar el ID directamente para que así se sepa bien.

3. Un índice compuesto es mejor porque con los índices separados lo que hace es hacer 2 búsquedas y ver cuáles coinciden. Como la cardinalidad del deleted es 2, es un valor muy bajo y por lo tanto buscar por deleted no ayuda mucho. Así que con el compuesto primero mira en la empresa y dentro de la empresa mira los que no están borrados.

4. Primero se usaría el middleware de rol para ver si el usuario es superadmin. Lo que queremos es que el superadmin se salte la seguridad del apartado 1 de esta defensa. Así que haríamos lo de inyectar el campo company poniendo req.user.company en el filter pero solo para no superadmins, y por lo tanto haríamos que el superadmin lo vea todo o pueda elegir qué ver mediante la query.

5. Una empresa puede ver todos los clientes de otras empresas porque no es un endpoint seguro. Así que puede ver información privada de los clientes de otras empresas. Y puede hacer análisis de datos con esa información.